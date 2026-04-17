import { Router } from "express";
import {
  deleteUser,
  getCurrentUser,
  getGoogleLoginCallback,
  getGoogleLoginPage,
  getSavedPosts,
  loginUser,
  logoutUser,
  registerUser,
  savePost,
} from "../controllers/user.controllers.js";
import { jwtAuth } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/google").get(getGoogleLoginPage);
router.route("/google/callback").get(getGoogleLoginCallback);

// protected routes
router.route("/logout").post(jwtAuth, logoutUser);
router.route("/").get(jwtAuth, getCurrentUser).delete(jwtAuth, deleteUser);
router.route("/savedPosts").get(jwtAuth, getSavedPosts);
router.route("/save").patch(jwtAuth, savePost);

export default router;
