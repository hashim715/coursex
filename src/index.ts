import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { chatController } from "./controllers/chatController";
import http from "http";
import { startMessageConsumer } from "./config/kafka";
import { userRouter } from "./routes/userRoutes";
import { clearRedisRouter } from "./routes/redisClearRoutes";
import { testingChatRouter } from "./routes/testingChatRoutes";
import { tokenRouter } from "./routes/tokenRoutes";
import { connectDB } from "./config/mongo";
import bodyParser from "body-parser";
import path from "path";

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT) || 5000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/user", userRouter);

app.use("/api/redis", clearRedisRouter);

app.use("/api/chat", testingChatRouter);

app.use("/api/token", tokenRouter);

const server: http.Server = http.createServer(app);

chatController(app, server);

startMessageConsumer();

const start = async (): Promise<void> => {
  try {
    server.listen(PORT, (): void => {
      console.log(`Listening on port ${PORT}`);
    });
    await connectDB();
  } catch (err) {
    console.log(err);
  }
};
start();
