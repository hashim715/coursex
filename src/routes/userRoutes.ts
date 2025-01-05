import express from "express";
import { Router } from "express";
import {
  register,
  login,
  createGroup,
  createNonCourseGroup,
  testingController,
  getGroupsByUser,
  getGroupDetails,
  getGroupsByColleges,
  joinGroups,
  isUserintheGroup,
  getUserInfo,
  editProfileInfo,
  getGroupJoinUrl,
  generateQrCode,
  getUserInfoById,
  leavethegroup,
  getGroups,
  getRecentGroups,
  getRecentUsers,
  createFlashCards,
  getFlashCards,
  getNonCourseGroupsByUser,
  getFlashCard,
  updateProfileDataOnSignUp,
  redirectUserToVerification,
  getUserAssistantName,
  getGroupAssistantName,
  syncGroupDetailsDataWhenOffline,
} from "../controllers/usercontroller";
import { protect } from "../middleware/auth";
import multer from "multer";

const uploadGroupImage = multer({
  dest: "uploads/groups",
});

export const userRouter: Router = express.Router();

userRouter.route("/register").post(register);
userRouter.route("/login").post(login);
userRouter.route("/createGroup").post(protect, createGroup);
userRouter
  .route("/testing")
  .post(
    protect,
    uploadGroupImage.fields([{ name: "image", maxCount: 1 }]),
    testingController
  );
userRouter.route("/getGroupsByUser").get(protect, getGroupsByUser);

userRouter
  .route("/getNonCourseGroupsByUser")
  .get(protect, getNonCourseGroupsByUser);

userRouter.route("/getGroupDetails/:group_id").get(protect, getGroupDetails);

userRouter
  .route("/getGroupsByCollege/:college_name")
  .get(protect, getGroupsByColleges);

userRouter.route("/joinGroups/:group_id").post(protect, joinGroups);

userRouter.route("/isUserexists/:group_id").get(protect, isUserintheGroup);

userRouter.route("/getuserinfo").get(protect, getUserInfo);

userRouter.route("/updateUserInfo").post(protect, editProfileInfo);

userRouter.route("/getGroupJoinUrl/:group_id").get(getGroupJoinUrl);

userRouter.route("/generateQrCode/:group_id").get(generateQrCode);

userRouter.route("/getUerInfoById/:id").get(protect, getUserInfoById);

userRouter.route("/leaveGroup/:group_id").post(protect, leavethegroup);

userRouter.route("/getGroups").get(protect, getGroups);

userRouter.route("/getRecentGroups").get(protect, getRecentGroups);

userRouter.route("/getRecentUsers").get(protect, getRecentUsers);

userRouter.route("/createFlashCard/:group_id").post(protect, createFlashCards);

userRouter.route("/getFlashcards/:group_id").get(protect, getFlashCards);

userRouter.route("/getFlashCard/:flashcard_id").get(protect, getFlashCard);

userRouter.route("/updateUserProfileOnSignUp").post(updateProfileDataOnSignUp);

userRouter
  .route("/redirectUserToVerification/:email/:screen")
  .get(redirectUserToVerification);

userRouter.route("/getUserAssistantName").get(protect, getUserAssistantName);

userRouter
  .route("/getGroupAssistantName/:group_id")
  .get(protect, getGroupAssistantName);

userRouter.route("/createNonCourseGroup").post(protect, createNonCourseGroup);

userRouter
  .route("/syncGroupDetailsDataWhenOffline")
  .get(protect, syncGroupDetailsDataWhenOffline);
