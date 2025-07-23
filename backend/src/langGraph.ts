import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import { Tool } from "langchain/tools";
import express from "express";
// const app = express();
const router = express.Router();
// 1. Initialize your LLM
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o",
  temperature: 0.2,
});

// 2. Initialize your tool
const tavilyTool = new DynamicStructuredTool({
  name: "tavily_search",
  description: "Useful for answering questions about current events or recent information from the web.",
  schema: z.object({
    query: z.string().describe("The search query to look up"),
  }),
  func: async ({ query }) => {
    const tavily = new TavilySearch({
      tavilyApiKey: process.env.TAVILY_API_KEY,
      maxResults: 10,
      topic: "general",
    });
    console.log("Tavily Search Query:", query);
    const result = await tavily.invoke({query});
    console.log("Tavily Search Result:", result);
    return result;
  }
});

// console.log(tavilyTool);
// console.log(tavily);

// 3. Optional: Add memory for multi-turn chat
const memory = new BufferMemory({ returnMessages: true,
memoryKey: "history",
outputKey: "output" // 👈 Add this line
 });
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You're a helpful AI assistant."],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
  ["ai", "{agent_scratchpad}"]
]);
// 4. Create the agent executor
const agent = await createOpenAIFunctionsAgent({
  llm,
  tools: [tavilyTool],
  prompt
});
const executor = AgentExecutor.fromAgentAndTools({
  agent,
  tools: [tavilyTool],
  memory,
  verbose: true,
});

// 5. Run the agent
// const res = await executor.invoke({ input: "how you help others" });
// console.log(res.output);
function pull<T>(arg0: string) {
  throw new Error("Function not implemented.");
}


function initializeAgentExecutorWithOptions(tools: any, llm: ChatOpenAI<ChatOpenAICallOptions>, arg2: { agentType: string; verbose: boolean; }) {
  throw new Error("Function not implemented.");
}

router.post("/run-agent", async (req, res) => {
  try{
        const { input } = req.body;
        if (!input) {
          return res.status(400).json({ message: "Input is required" });
        }
        //run the agent with the provided input
        const response = await executor.invoke({input});
        //send the response back to the client but chaeck any error exists if yes then return error message
        if(!response || !response.output) {
          return res.status(400).json({message:"Error while running"});
        }
        return res.status(200).json({output:response.output});
  }
  catch(error){
    return res.status(500).json({message:"Internal Server Error",error});
  }
})
export default router;