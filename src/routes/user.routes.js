import { Router } from "express";
import {
  deleteUser,
  getCurrentUser,
  getSavedPosts,
  githubLogin,
  googleLogin,
  loginUser,
  logoutUser,
  registerUser,
  savePost,
} from "../controllers/user.controllers.js";
import { jwtAuth } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/google").post(googleLogin);
router.route("/github").post(githubLogin);


// protected routes
router.route("/logout").post(jwtAuth, logoutUser);
router.route("/").get(jwtAuth, getCurrentUser).delete(jwtAuth, deleteUser);
router.route("/savedPosts").get(jwtAuth, getSavedPosts);
router.route("/save").patch(jwtAuth, savePost);

export default router;
