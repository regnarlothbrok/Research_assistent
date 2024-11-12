from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
    StorageContext
)
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.langchain import LangchainEmbedding
from langchain_community.embeddings import HuggingFaceEmbeddings  # Updated import
import qdrant_client
import yaml

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

    def qdrant_index(self):
        client = qdrant_client.QdrantClient(url=self.config["qdrant_url"])
        qdrant_vector_store = QdrantVectorStore(
            client=client, 
            collection_name=self.config['collection_name']
        )

        # Use Settings instead of ServiceContext
        Settings.llm = self.llm
        Settings.embed_model = self.load_embedder()
        Settings.chunk_size = self.config["chunk_size"]

        # Create storage context
        storage_context = StorageContext.from_defaults(
            vector_store=qdrant_vector_store
        )

        try:
            # Try to load existing index
            index = VectorStoreIndex.from_vector_store(
                vector_store=qdrant_vector_store,
            )
        except Exception as e:
            print(f"Creating new index: {str(e)}")
            # If loading fails, create new index from documents
            documents = SimpleDirectoryReader(self.config["data_path"]).load_data()
            index = VectorStoreIndex.from_documents(
                documents,
                storage_context=storage_context
            )

        return index