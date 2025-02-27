import express from "express";
import { Router } from "express";

import {
  checkingNumberofMembersInGroups,
  joinExistingUsersToGroup,
  deleteMessagesFromGroupsInTestingDatabase,
  verifyAllTheUsers,
  getAssistantGroupNamesWithGroupMembers,
} from "../controllers/testingControllers";

export const testingRouter: Router = express.Router();

// testingRouter
//   .route("/getGroupsWithZeroMembers")
//   .get(checkingNumberofMembersInGroups);

// testingRouter.route("/addUserToGroups").get(protect, joinExistingUsersToGroup);

// testingRouter
//   .route("/deleteMessagesFromGroups")
//   .get(deleteMessagesFromGroupsInTestingDatabase);

// testingRouter.route("/verifyAlltheusers").get(verifyAllTheUsers);

testingRouter
  .route("/getAssistantGroupNamesWithGroupMembers")
  .get(getAssistantGroupNamesWithGroupMembers);
