import express from "express";
import cookieParser from "cookie-parser";
import { configDotenv } from "dotenv";

configDotenv({path:".env"});

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