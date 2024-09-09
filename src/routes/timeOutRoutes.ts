import { testingTimeOut, fastapi } from "../controllers/timeOutTestController";
import express from "express";
import { Router } from "express";

export const timeOutRouter: Router = express.Router();

timeOutRouter.route("/testingTimeOut").get(testingTimeOut);
timeOutRouter.route("/fastapi").get(fastapi);
