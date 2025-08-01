import { fileURLToPath } from "url";
import express from "express";
import fs from "fs";
import path from "path";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  trimMessages,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import {v4 as uuidv4} from "uuid";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();
const upload = multer();
const app = express.Router();
// Helper to encode image to base64
function encodeImageToBase64(imagePath:any) {
  const imageBuffer = fs.readFileSync(imagePath);
  const mimeType = "image/jpeg";
  return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
}

// Set up LangChain with GPT-4-Vision
const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
  maxTokens: 1024,
  apiKey: process.env.OPENAI_API_KEY,
});
// console.log(response.text);

app.post('', upload.single("image"),async(req,res)=>{
    try{
        const text = req.body.text || "What is shown in this image?";
        const image = req.file; // buffer available here
        if(!image)return res.status(400).json({message:"Bad Response"});
        // Convert image buffer to base64 for GPT-4o
        const base64Image = `data:${image.mimetype};base64,${image.buffer.toString("base64")}`;
        // Send to OpenAI gpt-4o here with both text and image
        console.log("🧠 GPT-4 Vision Response:");
        // Send a message with the image + prompt
        const response = await model.invoke([
            new HumanMessage({
                content: [
                {
                    type: "text",
                    text: text,
                },
                {
                    type: "image_url",
                    image_url: {
                    url: base64Image,
                    },
                },
                ],
            }),
        ]);
        console.log("This is the response from opneAi😱\n",response.text);
        return res.status(200).json({message:response.text});
    }
    catch(error){
        return res.status(500).json({message:"Internal Server Error"});
    }
})

export default app;;
