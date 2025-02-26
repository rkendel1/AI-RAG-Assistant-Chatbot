import { index } from "../services/pineconeClient";

/**
 * Check the Pinecone index status and print the information.
 */
async function checkIndex() {
  try {
    const stats = await index.describeIndexStats();
    console.log("Pinecone Index Info:", JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error("Pinecone Connection Error:", error);
  }
}

checkIndex();
