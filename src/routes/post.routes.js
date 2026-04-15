import { Router } from "express";
import { jwtAuth } from "../middleware/auth.middleware.js";
import {
  createPost,
  deleteAPost,
  featurePost,
  getAllPosts,
  getSinglePost,
  updateAPost,
  uploadAuth,
} from "../controllers/post.controllers.js";
import { increasePostVisitCount } from "../middleware/visitCount.middleware.js";

const router = Router();

router.route("/upload-auth").get(uploadAuth);

router.route("/").get(getAllPosts);
router.route("/:slug").get(increasePostVisitCount, getSinglePost);

// protected routes
router.route("/").post(jwtAuth, createPost);
router.route("/:id").patch(jwtAuth, updateAPost);
router.route("/:id").delete(jwtAuth, deleteAPost);
router.route("/feature/feature-post").patch(jwtAuth, featurePost);

export default router;
