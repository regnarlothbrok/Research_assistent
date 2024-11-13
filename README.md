# Research Assistant 📚

An AI-powered web application for searching and analyzing research papers.

## Quick Start 🚀

Run these commands in separate terminals:

```bash
# 1. Start FastAPI Backend
uvicorn app:app --reload --port 8000 --log-level debug

# 2. Start Qdrant Vector Database
docker run -p 6333:6333 -v ~/qdrant_storage:/qdrant/storage:z qdrant/qdrant

# 3. Create and Run Ollama Model
ollama create research_assistant -f ollama/Modelfile
ollama run research_assistant

# 4. Start Frontend
npm start



Dependencies: 
# Python packages
pip install fastapi uvicorn llama-index langchain qdrant-client arxiv pydantic python-dotenv

# Node packages
npm install @mui/material @emotion/react @emotion/styled axios react-router-dom



Trobleshooting: 
# Restart Ollama service
ollama restart


# Academic Research Paper Assistant

## Key Functionalities

1. **Data Collection**:
   - Search for and collect related research papers on a given topic, particularly from platforms like ArXiv.
   - Store the collected research papers in a time-series database.

2. **Summarization**:
   - Summarize the research contributions from the past five years for a given topic.
   - Generate new work ideas and future research directions based on recent advancements.

3. **Question Answering**:
   - Provide answers to user questions regarding the research papers.
   - Handle questions related to images, charts, and graphs within the research papers.
   - Identify the exact sources (papers and sections) used to generate the answers.

4. **Review Paper Generation**:
   - Generate a comprehensive review paper that summarizes the key points and future research directions for a given topic.

5. **Multi-Agent Integration**:
   - Implement four distinct agents to handle the various tasks:
     - Search Agent: Fetch relevant research papers.
     - Database Agent: Query and retrieve papers from the time-series database.
     - Q&A Agent: Handle user questions and provide answers.
     - Future Works Agent: Generate potential improvements and create a review paper.

6. **Frontend and User Interaction**:
   - Provide a user-friendly frontend interface, likely using a framework like Streamlit, to enable users to:
     - Enter a research topic.
     - Browse the list of relevant research papers.
     - Interact with the application through a chat interface.
     - View the papers in a timeline format.
     - Select one or more papers for further discussion.
     - But There is one thing that Chatbot is taking too much time to give response.