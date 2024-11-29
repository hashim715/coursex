import { Router } from "express";
import express from "express";
import {
  uploadDocumentsToAssistant,
  getAssistantDocuments,
  deleteDocumentsFromAssistant,
} from "../controllers/knowledgebaseController";
import { protect } from "../middleware/auth";

export const knowledgeBaseRouter: Router = express.Router();

knowledgeBaseRouter
  .route("/uploadDocumentsToAssistant")
  .post(protect, uploadDocumentsToAssistant);

knowledgeBaseRouter
  .route("/getAssistantDocuments/:assistant_id")
  .get(protect, getAssistantDocuments);

knowledgeBaseRouter
  .route("/deleteDocumentsFromAssistant")
  .post(protect, deleteDocumentsFromAssistant);
