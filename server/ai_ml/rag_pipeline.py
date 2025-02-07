#!/usr/bin/env python
"""
Script 1: Simple RAG Pipeline with OpenAI and FAISS

This script demonstrates a Retrieval-Augmented Generation (RAG) pipeline using LangChain.
It:
  - Loads text documents from the "data" folder.
  - Creates document embeddings using OpenAI's embedding model.
  - Builds a FAISS vector store for similarity search.
  - Sets up a RetrievalQA chain to answer a sample query.

Ensure you have set your OpenAI API key in the environment variable OPENAI_API_KEY.
"""

import os
import glob
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import TextLoader
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

# Retrieve the OpenAI API key from the environment.
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("Please set the OPENAI_API_KEY environment variable.")


def load_documents(directory: str):
    """
    Loads all text documents from the specified directory.
    This function looks for all .txt files.
    """
    docs = []
    # Use glob to find all text files in the directory.
    for file_path in glob.glob(os.path.join(directory, "*.txt")):
        loader = TextLoader(file_path)
        docs.extend(loader.load())
    return docs

def main():
    # 1. Load documents from the "data" folder.
    docs = load_documents("data")
    print(f"Loaded {len(docs)} documents.")

    # 2. Initialize the OpenAI embeddings. This will call the OpenAI API to generate embeddings.
    embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

    # 3. Create a FAISS vector store from the loaded documents.
    vector_store = FAISS.from_documents(docs, embeddings)
    print("Vector store created with FAISS.")

    # 4. Create a RetrievalQA chain:
    #    - The LLM is OpenAI (configured with zero temperature for determinism).
    #    - The retriever uses the FAISS vector store to find similar documents.
    qa_chain = RetrievalQA.from_chain_type(
        llm=OpenAI(openai_api_key=openai_api_key, temperature=0),
        chain_type="stuff",  # "stuff" chain simply concatenates retrieved documents.
        retriever=vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 3}),
    )

    # 5. Define and run a query.
    query = "What is the main idea discussed in these documents?"
    answer = qa_chain.run(query)

    print("Query:", query)
    print("Answer:", answer)


if __name__ == "__main__":
    main()
