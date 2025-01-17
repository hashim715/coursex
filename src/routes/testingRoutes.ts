import express from "express";
import { Router } from "express";
import { checkingNumberofMembersInGroups } from "../controllers/testingControllers";

export const testingRouter: Router = express.Router();

testingRouter
  .route("/getGroupsWithZeroMembers")
  .get(checkingNumberofMembersInGroups);
