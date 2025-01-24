import express from "express";
import { Router } from "express";
import {
  checkingNumberofMembersInGroups,
  joinExistingUsersToGroup,
  deleteMessagesFromGroupsInTestingDatabase,
} from "../controllers/testingControllers";
import { protect } from "../middleware/auth";

export const testingRouter: Router = express.Router();

// testingRouter
//   .route("/getGroupsWithZeroMembers")
//   .get(checkingNumberofMembersInGroups);

// testingRouter.route("/addUserToGroups").get(protect, joinExistingUsersToGroup);

// testingRouter
//   .route("/deleteMessagesFromGroups")
//   .get(deleteMessagesFromGroupsInTestingDatabase);
