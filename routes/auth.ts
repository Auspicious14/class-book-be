import express from "express";
import {
  Login,
  forgetPassword,
  resetPassword,
  signUp,
  verifyOTP,
} from "../controllers/user";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", Login);
router.post("/forget", forgetPassword);
router.post("/verify", verifyOTP);
router.post("/reset", resetPassword);

export default router;
