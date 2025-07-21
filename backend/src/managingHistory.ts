import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  trimMessages,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import {v4 as uuidv4} from "uuid";
import express from "express"
import {
  START,END,MessagesAnnotation,StateGraph,MemorySaver,Annotation} from "@langchain/langgraph";
  import { ChatPromptTemplate } from "@langchain/core/prompts";

const app = express.Router();
//basic setup for learning to managing the conversation history.
const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human"
});

//these are some messages to be input inside a new history saver.
const messages = [
  new SystemMessage("you're a good assistant"),
  new AIMessage("hi!"),
  new HumanMessage("I like vanilla ice cream"),
  new AIMessage("nice"),
  new HumanMessage("hi! I'm bob"),
  new AIMessage("nice to meet you😊"),
  new HumanMessage("whats 2 + 2"),
  new AIMessage("4"),
  new HumanMessage("thanks"),
  new AIMessage("no problem!"),
  new HumanMessage("having fun?"),
  new AIMessage("yes!"),
];
// console.log("This is trimmer carrying timMessages Class : \n",trimmer);
const r = await trimmer.invoke(messages);
// console.log(r);
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  language: Annotation<string>(),
});
// console.log("graph annotation👌\n",GraphAnnotation)
const promptTemplate2 = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant. Answer all questions to the best of your ability in {language}.",
  ],
  ["placeholder", "{messages}"],
]);

const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4",
    temperature: 0,
});

const callModel4 = async (state: typeof GraphAnnotation.State) => {
  const trimmedMessage = await trimmer.invoke(state.messages);
  const prompt = await promptTemplate2.invoke({
    messages: trimmedMessage,
    language: state.language,
  });
  const response = await llm.invoke(prompt);
  return { messages: [response] };
};
// console.log("call Model called 👍",callModel4)
const workflow4 = new StateGraph(GraphAnnotation)
  .addNode("model", callModel4)
  .addEdge(START, "model")
  .addEdge("model", END);

const app4 = workflow4.compile({ checkpointer: new MemorySaver() });
const config5 = { configurable: { thread_id: uuidv4() } };
app.post('/',async(req,res)=>{
    console.log("messages from frontend👍 received \t",req.body);
    try{
        const {data} = req.body;
        const msg = {
            messages:[...messages,new HumanMessage(`${data}`)],
            language:"English",
        }
        const response = await app4.invoke(msg,config5);
        return res.status(200).json({message:response.messages[response.messages.length-1]});
    }
    catch(error){
        return res.status(500).json({message:"Internal Server Error"});
    }
})
export default app;