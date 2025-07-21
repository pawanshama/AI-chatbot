import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import { Tool } from "langchain/tools";

// 1. Initialize your LLM
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o",
  temperature: 0.2,
});

// 2. Initialize your tool
const tavily = new TavilySearch({
  tavilyApiKey: process.env.TAVILY_API_KEY,
  maxResults: 2,
});

// 3. Optional: Add memory for multi-turn chat
const memory = new BufferMemory({ returnMessages: true });
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You're a helpful AI assistant."],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);
// 4. Create the agent executor
const agent = await createOpenAIFunctionsAgent({
  llm,
  tools: [tavily],
  prompt
});
const executor = AgentExecutor.fromAgentAndTools({
  tools: [tavily],
  agent,
  memory,
  verbose: true,
});

// 5. Run the agent
const res = await executor.invoke({ input: "What's new about LangChain?" });
console.log(res.output);
function pull<T>(arg0: string) {
  throw new Error("Function not implemented.");
}


function initializeAgentExecutorWithOptions(tools: any, llm: ChatOpenAI<ChatOpenAICallOptions>, arg2: { agentType: string; verbose: boolean; }) {
  throw new Error("Function not implemented.");
}







// import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
// import { RunnableSequence } from "@langchain/core/runnables";
// import {TavilySearch} from "@langchain/tavily";
// import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
// import { createReactAgent, AgentExecutor } from "langchain/agents";



// const llm = new ChatOpenAI({apiKey:process.env.OPENAI_API_KEY ,model: "gpt-4o", temperature: 0.2 });
// const tavily = new TavilySearch({ maxResults: 2,tavilyApiKey:"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" });
// const prompt = ChatPromptTemplate.fromMessages([
//   ["system", "You're a helpful AI assistant."],
//   new MessagesPlaceholder("history"),
//   ["human", "{input}"],
// ]);
// // const tools = [tavily];
// // const executor = await initializeAgentExecutorWithOptions(tools, llm, {
// //   agentType: "openai-functions",
// //   verbose: true,
// // });
// async function run() {
//   const agent = await createReactAgent({ llm, tools: [tavily] });
//   const executor = new AgentExecutor({ agent, tools: [tavily] });
  
//   const result = await executor.invoke({
//     input: "What’s the latest news about LangChain?",
//   });

//   console.log(result.output);
// }

// run();

// const response = await executor.invoke({
//   input: "What's the latest news about LangChain?",
// });

// const chain = RunnableSequence.from([
//   {
//     history: async (input, config) => config?.configurable?.chat_history || [],
//     input: (input) => input.input,
//   },
//   prompt,
//   llm,
// ]);
// const runnableWithTool = chain.withConfig({
//   // tool: [tavily],
// });

// let checkpointHistory: { role: string; content: any; }[] = [];

// const runChat = async (userInput: any) => {
//   const result = await runnableWithTool.invoke({
//     input: userInput,
//   }, {
//     configurable: {
//       chat_history: checkpointHistory,
//     },
//   });

//   // Save state
//   checkpointHistory.push({ role: "user", content: userInput });
//   checkpointHistory.push({ role: "assistant", content: result.content });

//   return result;
// };
// // To time travel to a specific point:
// const rewindIndex = 4; // or any other step
// const stateAtCheckpoint = checkpointHistory.slice(0, rewindIndex);

// // Resume from there
// const result = await runnableWithTool.invoke({
//   input: "Now try this differently!",
// }, {
//   configurable: {
//     chat_history: stateAtCheckpoint,
//   },
// });