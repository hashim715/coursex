import express from "express";
import { Router } from "express";
import {
  register,
  login,
  createGroup,
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
  createEvent,
  getEvents,
  getEventDetails,
  getGroups,
  createJobs,
  getJobDetails,
  getJobs,
  createAlbum,
  getAlbumns,
  getSingleAlbum,
  getRecentAlbums,
  getRecentEvents,
  getRecentGroups,
  getEventsByUser,
  getRecentUsers,
  getMixedEventsAndAlbums,
  createFlashCards,
  getFlashCards,
  getNonCourseGroupsByUser,
  getFlashCard,
  updateProfileDataOnSignUp,
  redirectUserToVerification,
  getUserAssistantName,
} from "../controllers/usercontroller";
import { protect } from "../middleware/auth";
import multer from "multer";

const uploadProfileImage = multer({
  dest: "uploads/profile",
});

const uploadGroupImage = multer({
  dest: "uploads/groups",
});

const uploadEventImage = multer({
  dest: "uploads/events",
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

userRouter.route("/createEvent").post(protect, createEvent);

userRouter.route("/getEvents").get(protect, getEvents);

userRouter.route("/getEventDetails/:event_id").get(protect, getEventDetails);

userRouter.route("/getGroups").get(protect, getGroups);

userRouter.route("/createJobs").post(protect, createJobs);

userRouter.route("/getJobs").get(protect, getJobs);

userRouter.route("/getJobDetails/:job_id").get(protect, getJobDetails);

userRouter.route("/createAlbum").post(protect, createAlbum);

userRouter.route("/getAlbums").get(protect, getAlbumns);

userRouter.route("/getSingleAlbum/:album_id").get(protect, getSingleAlbum);

userRouter.route("/getRecentEvents").get(protect, getRecentEvents);

userRouter.route("/getRecentAlbums").get(protect, getRecentAlbums);

userRouter.route("/getRecentGroups").get(protect, getRecentGroups);

userRouter.route("/getEventsByUser").get(protect, getEventsByUser);

userRouter.route("/getRecentUsers").get(protect, getRecentUsers);

userRouter
  .route("/getMixedEventsAndAlbums")
  .get(protect, getMixedEventsAndAlbums);

userRouter.route("/createFlashCard/:group_id").post(protect, createFlashCards);

userRouter.route("/getFlashcards/:group_id").get(protect, getFlashCards);

userRouter.route("/getFlashCard/:flashcard_id").get(protect, getFlashCard);

userRouter.route("/updateUserProfileOnSignUp").post(updateProfileDataOnSignUp);

userRouter
  .route("/redirectUserToVerification/:email/:screen")
  .get(redirectUserToVerification);

userRouter.route("/getUserAssistantName").get(protect, getUserAssistantName);
