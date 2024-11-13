from datetime import datetime, timedelta
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.langchain import LangchainEmbedding
from langchain_community.embeddings import HuggingFaceEmbeddings
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from urllib.parse import quote, unquote
import requests
import arxiv
import os
import yaml
import qdrant_client
from tqdm import tqdm
from typing import List, Optional, Dict
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import hashlib

app = FastAPI(title="Research Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    topic: str
    max_results: Optional[int] = 10
    years: Optional[int] = 5

class ChatRequest(BaseModel):
    message: str

class PaperResponse(BaseModel):
    title: str
    authors: List[str]
    published: str
    url: str
    abstract: Optional[str] = None

class ResearchPaperFetcher:
    def __init__(self, config_file):
        with open(config_file, "r") as conf:
            self.config = yaml.safe_load(conf)
        self._create_data_folder()
        self.client = arxiv.Client(
            page_size=100,  # Increased from 5
            delay_seconds=1,
            num_retries=5    # Increased retries
        )
        self._papers_cache = {}
        self._context_cache = {}
        
    def _create_data_folder(self):
        if not os.path.exists(self.config["data_path"]):
            os.makedirs(self.config["data_path"])
            print("Data folder created")

    @lru_cache(maxsize=100)
    def _get_cache_key(self, topic: str) -> str:
        return hashlib.md5(topic.encode()).hexdigest()

    async def fetch_papers(self, topic: str, max_results: int = 10, years: int = 5):
        try:
            cache_key = self._get_cache_key(topic)
            if cache_key in self._papers_cache:
                cached_papers = self._papers_cache[cache_key]
                print(f"Found {len(cached_papers)} papers in cache")
                return cached_papers

            end_date = datetime.now()
            start_date = end_date - timedelta(days=years*365)
            
            date_filter = f"submittedDate:[{start_date.strftime('%Y%m%d')}* TO {end_date.strftime('%Y%m%d')}*]"
            query = f"{topic} AND {date_filter}"
            
            print(f"Fetching up to {max_results} papers for query: {query}")
            
            search = arxiv.Search(
                query=query,
                max_results=max_results * 2,  # Request more to ensure we get enough
                sort_by=arxiv.SortCriterion.SubmittedDate,
                sort_order=arxiv.SortOrder.Descending
            )

            papers = []
            paper_results = list(self.client.results(search))
            print(f"arXiv returned {len(paper_results)} papers")
            
            for paper in paper_results:
                try:
                    paper_info = {
                        'title': paper.title,
                        'authors': [str(author) for author in paper.authors],
                        'published': paper.published,
                        'url': paper.pdf_url,
                        'abstract': paper.summary
                    }
                    papers.append(paper_info)
                except Exception as e:
                    print(f"Error processing paper: {str(e)}")
                    continue

            print(f"Successfully processed {len(papers)} papers")
            self._papers_cache[cache_key] = papers[:max_results]
            return papers[:max_results]
            
        except Exception as e:
            print(f"Error in fetch_papers: {str(e)}")
            return []

    async def get_chat_context(self, topic: str) -> str:
        try:
            cache_key = self._get_cache_key(topic)
            
            if cache_key in self._context_cache:
                print("Using cached context")
                return self._context_cache[cache_key]

            papers = await self.fetch_papers(topic, max_results=10)  # Increased from 5
            print(f"Building context from {len(papers)} papers")

            context = "Available research papers:\n\n"
            for paper in papers:
                context += f"Title: {paper['title']}\n"
                context += f"Authors: {', '.join(paper['authors'])}\n"
                context += f"Abstract: {paper['abstract']}\n\n"

            self._context_cache[cache_key] = context
            return context

        except Exception as e:
            print(f"Error getting chat context: {str(e)}")
            return ""

fetcher = ResearchPaperFetcher("config.yml")

@app.post("/api/research/{topic}")
async def search_papers(topic: str, request: SearchRequest):
    try:
        decoded_topic = unquote(topic)
        max_results = max(min(request.max_results, 20), 10)  # At least 10, max 20
        years = min(request.years, 10)
        
        print(f"Requesting {max_results} papers for topic: {decoded_topic}")
        papers = await fetcher.fetch_papers(
            decoded_topic,
            max_results=max_results,
            years=years
        )
        print(f"Retrieved {len(papers)} papers")
        
        response = [
            {
                "title": paper["title"],
                "authors": paper["authors"],
                "published": paper["published"].strftime("%Y-%m-%d"),
                "url": paper["url"],
                "abstract": paper.get("abstract", "")
            }
            for paper in papers
        ]
        
        print(f"Final response contains {len(response)} papers")
        return {
            "status": "success",
            "papers": response,
            "total_papers": len(response)
        }
    
    except Exception as e:
        print(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/{topic}")
async def chat_about_papers(topic: str, request: ChatRequest):
    try:
        decoded_topic = unquote(topic)
        print(f"Processing chat for topic: {decoded_topic}")
        
        # Get context from cached papers
        context = await fetcher.get_chat_context(decoded_topic)
        
        # Enhanced prompt structure
        prompt = f"""You are a research assistant. Based on the following papers:

{context}

User question: {request.message}

Please provide a detailed and specific response focusing on the content of these papers. If summarizing advancements, list them point by point with specific details from the papers."""

        try:
            # Modified Ollama request
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "research_assistant:latest",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 2048,  # Increased for longer responses
                        "num_ctx": 4096,      # Increased context window
                        "stop": ["User:", "Human:", "<|im_end|>"]  # Better stop tokens
                    }
                },
                timeout=240
            )
            
            print(f"Ollama response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                response_text = data.get("response", "")
                
                # Clean up and format the response
                response_text = response_text.strip()
                if not response_text:
                    return {
                        "status": "error",
                        "response": "I apologize, but I couldn't generate a proper response based on the papers."
                    }
                
                # Format enumerated lists properly
                if response_text.startswith("1."):
                    response_text = "\n" + response_text
                
                return {
                    "status": "success",
                    "response": response_text
                }
            else:
                print(f"Error from Ollama: {response.text}")
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Ollama error: {response.text}"
                )
                
        except requests.exceptions.Timeout:
            raise HTTPException(
                status_code=504, 
                detail="The model is taking too long to respond. Please try again."
            )
        except requests.exceptions.ConnectionError:
            raise HTTPException(
                status_code=503, 
                detail="Unable to connect to the AI model service. Please check if Ollama is running."
            )
        except Exception as e:
            print(f"Unexpected error when calling Ollama: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail="An error occurred while processing your request."
            )
            
    except Exception as e:
        print(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    try:
        response = await asyncio.to_thread(
            requests.get,
            "http://localhost:11434/api/tags",
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            models = data.get("models", [])
            has_model = any(model["name"].startswith("research_assistant") for model in models)
            return {
                "status": "healthy",
                "services": {
                    "ollama": "running",
                    "model_loaded": has_model
                }
            }
        return {
            "status": "unhealthy",
            "error": "Ollama service not responding correctly"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")