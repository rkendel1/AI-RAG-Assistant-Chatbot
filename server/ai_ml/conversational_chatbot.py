#!/usr/bin/env python
"""
Script 3: Chatbot with Retrieval-Augmented Generation and Conversational Memory

This script demonstrates a conversational chatbot that integrates:
  - Document retrieval (using FAISS and OpenAI embeddings)
  - Conversational memory (to maintain context across interactions)
  - A retrieval-augmented generation chain that uses OpenAI's LLM

The chatbot loads documents from the "chat_data" folder.
Required packages:
  pip install langchain faiss-cpu openai
Ensure that OPENAI_API_KEY is set in your environment.
"""

import os
import glob
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import TextLoader
from langchain.chains import ConversationalRetrievalChain
from langchain.llms import OpenAI
from langchain.memory import ConversationBufferMemory

# Retrieve the OpenAI API key from the environment.
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("Please set the OPENAI_API_KEY environment variable.")


def load_documents(directory: str):
    """
    Loads all text documents from the specified directory.
    """
    docs = []
    for file_path in glob.glob(os.path.join(directory, "*.txt")):
        loader = TextLoader(file_path)
        docs.extend(loader.load())
    return docs

def main():
    # 1. Load documents from the "chat_data" folder.
    docs = load_documents("chat_data")
    print(f"Loaded {len(docs)} documents for chatbot retrieval.")

    # 2. Create embeddings using OpenAI's model.
    embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

    # 3. Build a FAISS vector store for document retrieval.
    vector_store = FAISS.from_documents(docs, embeddings)
    print("FAISS vector store created for retrieval.")

    # 4. Initialize conversation memory to store the chat history.
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    # 5. Create a ConversationalRetrievalChain that integrates:
    #    - OpenAI LLM (with a bit of creativity via temperature).
    #    - The vector store as a retriever.
    #    - Conversational memory to maintain context.
    conv_chain = ConversationalRetrievalChain.from_llm(
        llm=OpenAI(openai_api_key=openai_api_key, temperature=0.7),
        retriever=vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 3}),
        memory=memory,
        verbose=True
    )

    # 6. Chat loop: the user can type queries; type "exit" to quit.
    print("Chatbot is ready! Type 'exit' to quit.")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            break

        # Process the user input through the conversational chain.
        response = conv_chain.run(user_input)
        print("Bot:", response)


if __name__ == "__main__":
    main()
