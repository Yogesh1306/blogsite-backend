import { Router } from "express";
import {
  addComment,
  deleteComment,
  getComments,
} from "../controllers/comment.controllers.js";
import { jwtAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/:postId").get(getComments).post(jwtAuth, addComment);

router.route("/:commentId").delete(jwtAuth, deleteComment);

export default router;
