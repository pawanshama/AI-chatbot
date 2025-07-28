import {
  LlamaParseReader,
  // we'll add more here later
} from "llamaindex";
// import 'dotenv/config'
import express from "express";
const app = express.Router();
// async function main() {
//     // save the file linked above as sf_budget.pdf, or change this to match
//     const path = "./src/cover_letter.docx";

//   // set up the llamaparse reader
//   const reader = new LlamaParseReader({ resultType: "markdown",parse_mode: "parse_page_with_lvm" });

//   // parse the document
//   const documents = await reader.loadData(path);

//   // print the parsed document
//   console.log(documents)
// }

// main().catch(console.error);


import fs from "node:fs/promises";

import { openai, OpenAIEmbedding } from "@llamaindex/openai";
import {
  Document,
  MetadataMode,
  NodeWithScore,
  Settings,
  VectorStoreIndex,
} from "llamaindex";

Settings.llm = openai({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
});
Settings.embedModel = new OpenAIEmbedding();

async function main() {
  // Load essay from abramov.txt in Node
  // const path = "src/cover_letter.docx";

  // const essay = await fs.readFile(path, "utf-8");

  // Create Document object with essay
  // const document = new Document({ text: essay, id_: path });
  // const reader = new LlamaParseReader({ resultType: "markdown",parse_mode: "parse_page_with_lvm" });
  // const document = await reader.loadData(path);

  // Split text and create embeddings. Store them in a VectorStoreIndex
  // const index = await VectorStoreIndex.fromDocuments(document);

  //This is new code to parse a document
  const path = "node_modules/llamaindex/examples/abramov.txt";
  const essay = await fs.readFile(path, "utf-8");
  // Create Document object with essay
  const document = new Document({ text: essay, id_: path });
  // Split text and create embeddings. Store them in a VectorStoreIndex
  const index = await VectorStoreIndex.fromDocuments([document]);


  // Query the index
  const queryEngine = index.asQueryEngine();
  const { message, sourceNodes } = await queryEngine.query({
    query: "What this file is all about?",
  });

  // Output response with sources
  console.log(message.content);

  if (sourceNodes) {
    sourceNodes.forEach((source: NodeWithScore, index: number) => {
      console.log(
        `\n${index}: Score: ${source.score} - ${source.node.getContent(MetadataMode.NONE).substring(0, 50)}...\n`,
      );
    });
  }
}

main().catch(console.error);
app.post("/parse", async (req, res) => {
    try{

    }
    catch(error){
        console.error("Error parsing document:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

export default app;