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
userRouter
  .route("/createGroup")
  .post(
    protect,
    uploadGroupImage.fields([{ name: "image", maxCount: 1 }]),
    createGroup
  );
userRouter
  .route("/testing")
  .post(
    protect,
    uploadGroupImage.fields([{ name: "image", maxCount: 1 }]),
    testingController
  );
userRouter.route("/getGroupsByUser").get(protect, getGroupsByUser);

userRouter.route("/getGroupDetails/:group_id").get(protect, getGroupDetails);

userRouter
  .route("/getGroupsByCollege/:college_name")
  .get(protect, getGroupsByColleges);

userRouter.route("/joinGroups/:group_id").post(protect, joinGroups);

userRouter.route("/isUserexists/:group_id").get(protect, isUserintheGroup);

userRouter.route("/getuserinfo").get(protect, getUserInfo);

userRouter
  .route("/updateUserInfo")
  .post(
    protect,
    uploadProfileImage.fields([{ name: "image", maxCount: 1 }]),
    editProfileInfo
  );

userRouter.route("/getGroupJoinUrl/:group_id").get(getGroupJoinUrl);

userRouter.route("/generateQrCode/:group_id").get(generateQrCode);

userRouter.route("/getUerInfoById/:id").get(protect, getUserInfoById);

userRouter.route("/leaveGroup/:group_id").post(protect, leavethegroup);

userRouter
  .route("/createEvent")
  .post(
    protect,
    uploadEventImage.fields([{ name: "image", maxCount: 1 }]),
    createEvent
  );

userRouter.route("/getEvents").get(protect, getEvents);

userRouter.route("/getEventDetails/:event_id").get(protect, getEventDetails);

userRouter.route("/getGroups").get(protect, getGroups);

userRouter.route("/createJobs").post(protect, createJobs);

userRouter.route("/getJobs").get(protect, getJobs);

userRouter.route("/getJobDetails/:job_id").get(protect, getJobDetails);

userRouter.route("/createAlbum").post(protect, createAlbum);

userRouter.route("/getAlbums").get(protect, getAlbumns);

userRouter.route("/getSingleAlbum/:album_id").get(protect, getSingleAlbum);
