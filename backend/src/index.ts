
import express from "express"
import cors from "cors"
// import bodyParser from "body-parser";
import dotenv from "dotenv";
import backendROutes from "./backend.js";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
// app.use(bodyParser.json());
app.use('/api/routes',backendROutes);
const port = 9001;
app.listen(port,()=>{
  console.log(`server is running on ${port}`)
});