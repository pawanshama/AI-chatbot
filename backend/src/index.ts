
import express from "express"
import cors from "cors"
// import bodyParser from "body-parser";
import dotenv from "dotenv";
import backendROutes from "./backend.js";
import ImageUpload from "./imageUpload.js"
import managingRoutes from "./managingHistory.js"
dotenv.config();
const app = express();
process.env.LANGSMITH_TRACING = "true";
process.env.LANGSMITH_API_KEY = "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";
app.use(express.json());
app.use(cors());
// app.use(bodyParser.json());
app.use('/api/routes',backendROutes);
app.use('/api/chat',ImageUpload);
app.use('/api/route/trim_first',managingRoutes)
// app.use('/api/chat',managingRoutes)
const port = 9001;
app.listen(port,()=>{
  console.log(`server is running on ${port}`)
});