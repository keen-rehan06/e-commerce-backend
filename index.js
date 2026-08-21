import express from "express";
import cookieParser from "cookie-parser";
import { configDotenv } from "dotenv";
import { connectDb } from "./src/config/db/db.js";

configDotenv({path:".env"});

;(()=>{
    try {
        await connectDb();
    } catch (error) {
        console.log("MongoDb Connection Failed ❌",error);
    }
})()

const app = express();

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(cookieParser());

app.get("/",(req,res)=>{
    res.send("Hello")
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`)
});