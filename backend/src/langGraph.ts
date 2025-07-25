import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import express from "express";
import { tavily } from "@tavily/core"
import { SerpAPI } from "@langchain/community/tools/serpapi";
import axios from "axios";
const router = express.Router();
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
      console.log("🔥 Tavily Tool Invoked with Query:", query);

      const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

      try {
        const result = await client.search(query);
        console.log("✅ Tavily API Result:", result);
        return result.results || "No answer found.";
      } catch (err) {
        console.error("❌ Tavily API Error:", err);
        return "An error occurred while performing the web search.";
      }
    }
  });

// 3. Optional: Add memory for multi-turn chat
const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "history",
  outputKey: "output", // 👈 Add this line
});
const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are an AI assistant."],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
  ["ai", "{agent_scratchpad}"]
]);

const serpApiTool = new DynamicStructuredTool({
  name: "serp_search",
  description: "Use this tool to perform a Google-like search and retrieve up-to-date results from the web.",
  schema: z.object({
    query: z.string().describe("The search query to look up."),
  }),
  func: async ({ query }) => {
    console.log("🔥 SerpAPI Tool Invoked with Query:", query);
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_API_KEY}`;
    const res = await axios.get(url);
    const topResults = res.data?.organic_results?.slice(0, 3) ?? [];
    return topResults.map((r: { title: any; link: any; }) => `🔗 ${r.title} - ${r.link}`).join("\n") || "No results found.";
  }
});
// 4. Create the agent executor
const agent = await createOpenAIFunctionsAgent({
  llm,
  tools: [tavilyTool, serpApiTool],
  prompt,
});

const executor = AgentExecutor.fromAgentAndTools({
  agent,
  tools: [tavilyTool, serpApiTool],
  memory,
  verbose: true,
});


// Manual agent logic
router.post("/run-agent", async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ message: "Input is required" });
    }

   //5. run the agent with the provided input
    const response = await executor.invoke({input});
    // console.log("Agent Response:", response);
    if(response && response.output!=="") {
      return res.status(200).json({ output: response.output });
    }
    // Step 1: Ask LLM what tool to use (you can customize this logic)
    const toolSelectPrompt = `Decide which tool to use for the user's query: "${input}". Respond with either "tavily" or "serp".`;

    const toolChoiceResp = await llm.invoke(toolSelectPrompt);
    const contentStr = Array.isArray(toolChoiceResp.content)
      ? toolChoiceResp.content.map((c: any) => (typeof c === "string" ? c : c.text ?? "")).join(" ")
      : (typeof toolChoiceResp.content === "string"
        ? toolChoiceResp.content
        : (typeof toolChoiceResp.content === "object" && toolChoiceResp.content !== null && "text" in toolChoiceResp.content
            ? (toolChoiceResp.content as { text: string }).text
            : ""));
    const toolChoice = contentStr.toLowerCase().includes("serp")
      ? "serp"
      : "tavily";

    console.log("🧠 Tool selected by LLM:", toolChoice);

    // Step 2: Run the selected tool manually
    let toolResult:string = "";
    if (toolChoice === "tavily") {
      const result = await tavilyTool.func({ query: input });
      toolResult = Array.isArray(result) ? JSON.stringify(result) : result;
    } else {
      toolResult = await serpApiTool.func({ query: input });
    }
    console.log("🔧 Tool result:", toolResult);
    // Step 3: Provide tool result back to LLM to summarize for the user
    const finalPrompt = `The user asked: "${input}". Here's the tool result:\n\n${toolResult}\n\nGive a helpful and concise answer.`;

    let finalAnswer = await llm.invoke(finalPrompt);
    let timeoutTriggered= false;
    let timeOutId=setTimeout(()=>{
      timeoutTriggered = true;
      console.log("exit this llm invocation loop after 60 seconds if no valid response is received.");
    },60000)  

    while (!finalAnswer || !finalAnswer.content && !timeoutTriggered) {
      console.error("❌ LLM did not return a valid response. Retrying...");
      const retryResponse = await llm.invoke(finalPrompt);
      if (retryResponse && retryResponse.content!== "") {
        finalAnswer = retryResponse;
        break;
      }
    }
    clearTimeout(timeOutId);
    console.log("💬 Final answer from LLM:", finalAnswer.content);
    return res.status(200).json({ output: finalAnswer.content });
  } catch (err) {
    console.error("❌ Error in /run-agent-manual:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err });
  }
});
export default router;