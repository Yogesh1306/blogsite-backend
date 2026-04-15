import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";

const getComments = async (req, res) => {
  const postId = req.params.postId;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "No post exist");
  }

  const comments = await Comment.find({ post: postId })
    .populate("user", "username avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json({ status: 200, comments, message: "All comments loaded" });
};

const addComment = async (req, res) => {
  const postId = req.params.postId;
  const { desc } = req.body;
  const user = req.user._id;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "No post exist");
  }

  const comment = await Comment.create({ post: postId, user, desc });
  if (!comment) {
    throw new ApiError(500, "Error adding the comment");
  }

  return res
    .status(201)
    .json({ status: 201, comment, message: "Comment added!!" });
};

const deleteComment = async (req, res) => {
  const user = req?.user;
  const commentId = req.params.commentId;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "No such comment exist");
  }

  if (user.role === "admin") {
    await Comment.findByIdAndDelete({
      _id:comment._id,
    });
    return res
      .status(200)
      .json({ status: 200, message: "successfully deleted the comment" });
  }

  if (!comment.user.equals(req.user._id)) {
    throw new ApiError(403, "You can delete only your comment");
  }

  const deletedComment = await Comment.findOneAndDelete({
    _id: comment._id,
    user: user._id,
  });

  if (!deletedComment) {
    throw new ApiError(500, "Something went wrong while deleting comment");
  }

  return res
    .status(200)
    .json({ status: 200, message: "successfully deleted the comment" });
};

export { getComments, addComment, deleteComment };
