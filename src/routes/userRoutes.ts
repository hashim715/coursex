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
} from "../controllers/usercontroller";
import { protect } from "../middleware/auth";
import multer from "multer";

const uploadProfileImage = multer({
  dest: "uploads/profile",
});

const uploadGroupImage = multer({
  dest: "uploads/groups",
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
