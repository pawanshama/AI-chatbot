import express from "express"
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
const app = express.Router();
import {v4 as uuidv4} from "uuid";
import {
  START,END,MessagesAnnotation,StateGraph,MemorySaver,} from "@langchain/langgraph";
// import * as s from "@langchain/langgraph";
  // Define or import llm before using it
const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4",
    temperature: 0,
});

const callModel = async(state:typeof MessagesAnnotation.State)=>{
  const response = await llm.invoke(state.messages);
  return {messages:response};
} 
  //a new graph
const workflow = new StateGraph(MessagesAnnotation)
             .addNode("model",callModel)
             .addEdge(START,"model")
             .addEdge("model",END);
  //Add memory
  const memory = new MemorySaver();
  const app1 = workflow.compile({checkpointer:memory});
  // config setup
  const config = {configurable:{thread_id:uuidv4()}};
  // const input = [
  //   {
  //     role:"user",
  //     content:"Hi! I'm Pawan.",
  //   },
  // ];
  // const output = await app1.invoke({messages:input},config);
app.post('/language',async(req,res)=>{
  console.log("Inside language route😊",req.body);
  try{
    if(!req.body)return res.status(400).json({message:"Bad Request in Backend"});
    const {value,eld} = req.body;
    // const model = new ChatOpenAI({
    //   apiKey: process.env.OPENAI_API_KEY,
    //   model: "gpt-4",
    //   temperature: 0,
    // });
    
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "Translate the following from English into {language}"],
      ["user", "{text}"],
    ]);
    
    const promptValue = await prompt.invoke({
      language: `${value}`,
      text: `${eld}`,
    });
    
    const response = await llm.invoke(promptValue);
    // console.log(response.content);
    const resp = await llm.invoke(promptValue, {
      metadata: { run_name: "TranslationTask" },
    });
    // console.log("this is the latest and last response : : ... ",resp);
    return res.status(200).json({message:`${response.content}`});
  }
  catch(error){
    return res.status(500).json({message:'Internal server error'});
  }
})

app.post('/assistant',async(req,res)=>{
  try{
    const {data} = req.body;
    const input=[
    {
      role: "user",
      content: `${data}`,
    },
    ]
    const response = await app1.invoke({messages:input},config);
    return res.status(200).json({messages:response.messages});
  }
  catch(error){
      return res.status(500).json({message:"Internal Server Error"});
  }
})

app.post('/friend',async(req,res)=>{
  try{
    const data = req.body;
  }
  catch(error){
      return res.status(500).json({message:"Internal Server Error"});
  }
})


export default app;