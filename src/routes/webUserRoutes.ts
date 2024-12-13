import express from "express";
import { Router } from "express";
import { createUser } from "../controllers/webUserController";

export const webUserRouter: Router = express.Router();

webUserRouter.route("/create").post(createUser);
