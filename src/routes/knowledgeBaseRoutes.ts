import { Router } from "express";
import express from "express";
import {
  createAssistantApi,
  uploadFiletoAssistant,
  chatWithAssistant,
  uploadDocumentsToAssistant,
} from "../controllers/knowledgebaseController";
import { protect } from "../middleware/auth";

export const knowledgeBaseRouter: Router = express.Router();

knowledgeBaseRouter
  .route("/uploadDocumentsToAssistant")
  .post(protect, uploadDocumentsToAssistant);
