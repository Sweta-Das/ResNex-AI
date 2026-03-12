from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
import uvicorn
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class PDFRequest(BaseModel):
    url: str
    project_id: str
    file_name: str

DATABASE_URL = os.getenv("DATABASE_URL")

@app.post("/process-pdf")
async def process_pdf(request: PDFRequest):
    try:
        print(f"--- Starting Analysis for: {request.file_name} ---")
        
        # Load PDF
        loader = PyPDFLoader(request.url)
        pages = loader.load()
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(pages)

        # Connect to NeonDB
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Save chunks to table
        for chunk in chunks:
            cursor.execute(
                "INSERT INTO research_knowledge (project_id, content, source_type, file_name) VALUES (%s, %s, %s, %s)",
                (request.project_id, chunk.page_content, 'pdf', request.file_name)
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Successfully saved {len(chunks)} chunks to NeonDB")
        return {"status": "success", "chunks": len(chunks)}
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)