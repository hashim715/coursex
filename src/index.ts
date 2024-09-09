import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { chatController } from "./controllers/chatController";
import http from "http";
import { startMessageConsumer } from "./config/kafka";
import { userRouter } from "./routes/userRoutes";
import { clearRedisRouter } from "./routes/redisClearRoutes";
import { testingChatRouter } from "./routes/testingChatRoutes";
import { tokenRouter } from "./routes/tokenRoutes";
import { chatRouter } from "./routes/chatRoutes";
import { timeOutRouter } from "./routes/timeOutRoutes";
import { verificationRouter } from "./routes/verificationRoutes";
import { connectDB } from "./config/mongo";
import { redisClient } from "./config/redisClient";
import bodyParser from "body-parser";
import path from "path";
import { createTopic } from "./config/kafka";
import timeout from "connect-timeout";

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT) || 5000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(timeout("5s"));

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  if (req.timedout) {
    return res.status(503).json({
      success: false,
      message: "Your request has timed out. Please try again later.",
    });
  }
  return res
    .status(500)
    .json({ success: false, message: "Something went wrong try again.." });
});

app.use("/api/user", userRouter);

app.use("/api/redis", clearRedisRouter);

app.use("/api/chat", testingChatRouter);

app.use("/api/token", tokenRouter);

app.use("/api/chats", chatRouter);

app.use("/api/timeOut", timeOutRouter);

app.use("/api/verify", verificationRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  if (req.timedout) {
    return res.status(503).json({
      success: false,
      message: "Your request has timed out. Please try again later.",
    });
  }
  return res
    .status(500)
    .json({ success: false, message: "Something went wrong try again.." });
});

const server: http.Server = http.createServer(app);

chatController(app, server);

createTopic();

startMessageConsumer();

const start = async (): Promise<void> => {
  try {
    server.listen(PORT, (): void => {
      console.log(`Listening on port ${PORT}`);
    });
    await connectDB();
    await redisClient.flushDb();
  } catch (err) {
    console.log(err);
    await redisClient.flushDb();
  }
};
start();
