// config/redis.js
import Redis from "ioredis";
import { configDotenv } from "dotenv";
configDotenv({path:".env"});

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6380");

export default redis;