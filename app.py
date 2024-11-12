from datetime import datetime, timedelta
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.langchain import LangchainEmbedding
from langchain_community.embeddings import HuggingFaceEmbeddings
import arxiv
import os
import yaml
import qdrant_client
from tqdm import tqdm

class ResearchPaperFetcher:
    def __init__(self, config_file):
        with open(config_file, "r") as conf:
            self.config = yaml.safe_load(conf)
        self._create_data_folder()
        
    def _create_data_folder(self):
        if not os.path.exists(self.config["data_path"]):
            os.makedirs(self.config["data_path"])
            print("Data folder created")
        else:
            print("Data folder exists")

    def fetch_papers(self, topic, max_results=10, years=5):
        """
        Fetch papers on a specific topic from the last N years
        """
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years*365)
        
        # Construct arxiv query with date filter
        date_filter = f"submittedDate:[{start_date.strftime('%Y%m%d')}* TO {end_date.strftime('%Y%m%d')}*]"
        query = f"{topic} AND {date_filter}"
        
        client = arxiv.Client()
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending
        )

        print(f"Fetching papers about '{topic}' from the last {years} years...")
        papers = []
        for paper in tqdm(list(client.results(search))):
            try:
                # Create a more structured filename
                clean_title = "".join(c for c in paper.title if c.isalnum() or c.isspace())
                filename = f"{paper.published.strftime('%Y%m%d')}_{clean_title[:50]}.pdf"
                filepath = os.path.join(self.config["data_path"], filename)
                
                # Download the paper
                paper.download_pdf(dirpath=self.config["data_path"], filename=filename)
                
                # Save metadata
                metadata_file = os.path.join(self.config["data_path"], f"{filename[:-4]}_metadata.txt")
                with open(metadata_file, "w", encoding="utf-8") as f:
                    f.write(f"Title: {paper.title}\n")
                    f.write(f"Authors: {', '.join(str(author) for author in paper.authors)}\n")
                    f.write(f"Published: {paper.published}\n")
                    f.write(f"URL: {paper.pdf_url}\n")
                    f.write(f"Abstract: {paper.summary}\n")
                
                papers.append({
                    'title': paper.title,
                    'authors': [str(author) for author in paper.authors],
                    'published': paper.published,
                    'file': filepath,
                    'url': paper.pdf_url
                })
                
                print(f"Downloaded: {paper.title}")
                
            except Exception as e:
                print(f"Error downloading {paper.title}: {str(e)}")
                continue
        
        return papers

# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Fetch research papers on a specific topic')
    parser.add_argument('--topic', type=str, required=True, help='Research topic to search for')
    parser.add_argument('--years', type=int, default=5, help='Number of years to look back')
    parser.add_argument('--max', type=int, default=10, help='Maximum number of papers to fetch')
    
    args = parser.parse_args()
    
    fetcher = ResearchPaperFetcher("config.yml")
    papers = fetcher.fetch_papers(
        topic=args.topic,
        max_results=args.max,
        years=args.years
    )
    
    print(f"\nFetched {len(papers)} papers")
    for paper in papers:
        print(f"- {paper['title']} ({paper['published'].strftime('%Y-%m-%d')})")