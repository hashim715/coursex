import express from "express";
import { Router } from "express";

import {
  checkingNumberofMembersInGroups,
  joinExistingUsersToGroup,
} from "../controllers/testingControllers";

export const testingRouter: Router = express.Router();

// testingRouter
//   .route("/getGroupsWithZeroMembers")
//   .get(checkingNumberofMembersInGroups);

// testingRouter.route("/addExistingUsersToGroups").get(joinExistingUsersToGroup);
