from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.core import StorageContext
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.langchain import LangchainEmbedding
from langchain_community.embeddings import HuggingFaceEmbeddings
import qdrant_client
import yaml
from datetime import datetime, timedelta
import arxiv
from tqdm import tqdm
import os

class RAG:
    def __init__(self, config_file, llm):
        self.config = config_file
        self.qdrant_client = qdrant_client.QdrantClient(
            url=self.config['qdrant_url']
        )
        self.llm = llm  # ollama llm
   
    def load_embedder(self):
        embed_model = LangchainEmbedding(
            HuggingFaceEmbeddings(model_name=self.config['embedding_model'])
        )
        return embed_model

    def _create_data_folder(self, download_path):
        if not os.path.exists(download_path):
            os.makedirs(download_path)
            print("Output folder created")
        else:
            print("Output folder exists")

    def download_papers(self, topic, download_path, max_results=10, years=5):
        """Download papers from arXiv based on topic and time range"""
        self._create_data_folder(download_path)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years*365)
        
        # Construct arxiv query
        date_filter = f"submittedDate:[{start_date.strftime('%Y%m%d')}* TO {end_date.strftime('%Y%m%d')}*]"
        query = f"{topic} AND {date_filter}"
        
        client = arxiv.Client()
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending
        )

        print(f"\nFetching papers about '{topic}' from the last {years} years...")
        try:
            results = list(client.results(search))
            for paper in tqdm(results):
                try:
                    # Create a clean filename
                    clean_title = "".join(c for c in paper.title if c.isalnum() or c.isspace())[:50]
                    filename = f"{paper.published.strftime('%Y%m%d')}_{clean_title}.pdf"
                    
                    # Download PDF
                    paper.download_pdf(dirpath=download_path, filename=filename)
                    
                    # Save metadata
                    metadata_file = os.path.join(download_path, f"{filename[:-4]}_metadata.txt")
                    with open(metadata_file, "w", encoding="utf-8") as f:
                        f.write(f"Title: {paper.title}\n")
                        f.write(f"Authors: {', '.join(str(author) for author in paper.authors)}\n")
                        f.write(f"Published: {paper.published}\n")
                        f.write(f"URL: {paper.pdf_url}\n")
                        f.write(f"Abstract: {paper.summary}\n")
                    
                    print(f"\nDownloaded: {paper.title}")
                    
                except Exception as e:
                    print(f"\nError downloading {paper.title}: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"Error searching for papers: {str(e)}")

    def qdrant_index(self):
        client = qdrant_client.QdrantClient(url=self.config["qdrant_url"])
        qdrant_vector_store = QdrantVectorStore(
            client=client, collection_name=self.config['collection_name']
        )
        
        Settings.llm = self.llm
        Settings.embed_model = self.load_embedder()
        Settings.chunk_size = self.config["chunk_size"]
        
        storage_context = StorageContext.from_defaults(
            vector_store=qdrant_vector_store
        )
        
        try:
            documents = SimpleDirectoryReader(self.config["data_path"]).load_data()
            index = VectorStoreIndex.from_documents(
                documents,
                storage_context=storage_context
            )
            return index
        except Exception as e:
            print(f"Error creating index: {str(e)}")
            return None

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--topic", 
        type=str,
        help="Topic to search for papers"
    )
    parser.add_argument(
        "--years", 
        type=int, 
        default=5,
        help="Number of years to look back"
    )
    parser.add_argument(
        "--max", 
        type=int, 
        default=10,
        help="Maximum number of papers to download"
    )
    parser.add_argument(
        "--ingest",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Ingest data to Qdrant vector Database"
    )
    
    args = parser.parse_args()
    
    # Load config
    config_file = "config.yml"
    with open(config_file, "r") as conf:
        config = yaml.safe_load(conf)
    
    # Initialize RAG
    rag = RAG(config_file=config, llm=None)  # We don't need LLM for downloading
    
    # Download papers if topic is provided
    if args.topic:
        rag.download_papers(
            topic=args.topic,
            download_path=config["data_path"],
            max_results=args.max,
            years=args.years
        )
    
    # Ingest if requested
    if args.ingest:
        print("\nLoading Embedder...")
        from llama_index.llms.ollama import Ollama
        llm = Ollama(model=config["llm_name"], base_url=config["llm_url"])
        rag.llm = llm
        rag.ingest()