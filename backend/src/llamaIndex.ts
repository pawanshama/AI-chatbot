import {
  LlamaParseReader,
  // we'll add more here later
} from "llamaindex";
import 'dotenv/config'
import express from "express";
const app = express.Router();
async function main() {
    // save the file linked above as sf_budget.pdf, or change this to match
    const path = "./src/image.png";

  // set up the llamaparse reader
  const reader = new LlamaParseReader({ resultType: "markdown" });

  // parse the document
  const documents = await reader.loadData(path);

  // print the parsed document
  console.log(documents)
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