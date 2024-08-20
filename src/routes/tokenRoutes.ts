import { refreshToken } from "../controllers/refreshToken";
import express from "express";
import { Router } from "express";

export const tokenRouter: Router = express.Router();

tokenRouter.route("/refresh").post(refreshToken);
