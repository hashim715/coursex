import {
  addToRoom,
  addToActiveUsers,
  RemoveFromActiveUsers,
  getActiveUsers,
  RemoveFromGroupUsers,
  getGroupMapUsers,
  addActiveSocksts,
  RemoveFromSocketsList,
  getSocketsList,
} from "../controllers/testingChatFunctions";
import { Router } from "express";
import express from "express";

export const testingChatRouter: Router = express.Router();

testingChatRouter.route("/addToRoom").post(addToRoom);
testingChatRouter.route("/addToActiveUsers").post(addToActiveUsers);
testingChatRouter.route("/removeFromActiveUsers").post(RemoveFromActiveUsers);
testingChatRouter.route("/getActiveUsers").get(getActiveUsers);
testingChatRouter.route("/removeFromGroupMapUsers").post(RemoveFromGroupUsers);
testingChatRouter.route("/getGroupRoomUsers").get(getGroupMapUsers);
testingChatRouter.route("/addActiveSockets").post(addActiveSocksts);
testingChatRouter.route("/getActiveSockets").get(getSocketsList);
testingChatRouter.route("/RemoveFromSocketsList").post(RemoveFromSocketsList);
