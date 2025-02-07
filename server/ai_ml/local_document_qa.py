#!/usr/bin/env python
"""
Script 2: Document Question Answering with Local Embeddings

This script demonstrates a question-answering system over a document corpus.
It:
  - Loads documents from the "docs" directory.
  - Uses a local Sentence Transformer model ("all-MiniLM-L6-v2") to generate embeddings.
  - Builds a FAISS vector store from these embeddings.
  - Sets up a RetrievalQA chain using OpenAI's LLM to answer a sample question.

Required packages:
  pip install langchain faiss-cpu sentence-transformers openai
"""

from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import DirectoryLoader
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI


def main():
    # 1. Load documents from the "docs" directory.
    #    DirectoryLoader will recursively load all .txt files.
    loader = DirectoryLoader("docs", glob="**/*.txt")
    docs = loader.load()
    print(f"Loaded {len(docs)} documents from the 'docs' directory.")

    # 2. Initialize local embeddings using a small Sentence Transformer model.
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # 3. Build a FAISS vector store from the documents using the embeddings.
    vector_store = FAISS.from_documents(docs, embeddings)
    print("FAISS vector store created using local embeddings.")

    # 4. Set up a RetrievalQA chain.
    #    Here we use OpenAI as the final language model.
    qa_chain = RetrievalQA.from_chain_type(
        llm=OpenAI(temperature=0),  # Uses the OPENAI_API_KEY from your env variables.
        chain_type="stuff",
        retriever=vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 5}),
    )

    # 5. Define a sample question and run the chain.
    question = "Can you summarize the key points in the documents?"
    answer = qa_chain.run(question)

    print("Question:", question)
    print("Answer:", answer)


if __name__ == "__main__":
    main()
