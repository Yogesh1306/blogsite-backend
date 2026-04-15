import { Post } from "../models/post.model.js";

const increasePostVisitCount = async (req, res, next) => {
  const { slug } = req.params;
  const post = await Post.findOne({ slug });
  if (!post) {
    throw new ApiError(404, "slug not identified");
  }
  post.visits += 1;
  await post.save();
  next();
};

export { increasePostVisitCount };
