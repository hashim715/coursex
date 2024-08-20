import { clearRedis } from "../controllers/clearRedis";
import { Router } from "express";
import express from "express";

export const clearRedisRouter: Router = express.Router();

clearRedisRouter.route("/clearRedis").get(clearRedis);
