import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import ImageKit from "@imagekit/nodejs";

const createPost = async (req, res) => {
  const { title, desc, content, coverImg, category } = req.body;
  const user = req.user;

  if (!title && !content) {
    throw new ApiError(400, "Required fields are missing");
  }

  let slug = title.replace(/ /g, "-").toLowerCase();

  let existingPost = await Post.findOne({ slug });

  let counter = 2;
  while (existingPost) {
    slug = `${slug}-${counter}`;
    existingPost = await Post.findOne({ slug });
    counter++;
  }

  const post = await Post.create({
    user: user._id,
    title,
    coverImg,
    category,
    slug,
    desc,
    content,
  });
  const createdPost = await Post.findById(post._id).populate(
    "user",
    "username email",
  );
  if (!createdPost) {
    throw new ApiError(500, "Error creating new post, Try Again!!");
  }
  return res.status(200).json({
    status: 200,
    item: createdPost,
    message: "successfully created",
  });
};

const getSinglePost = async (req, res) => {
  const { slug } = req.params;
  const post = await Post.findOne({ slug }).populate("user", "username avatar");
  if (!post) {
    throw new ApiError(404, "slug not identified");
  }
  return res.status(200).json({
    status: 200,
    item: post,
    message: "successfully retrieved single post",
  });
};

const getAllPosts = async (req, res) => {
  const page = Number.parseInt(req.query.page) || 1;
  const limit = Number.parseInt(req.query.limit) || 10;

  const query = {};

  const cat = req.query.cat;
  const author = req.query.author;
  const searchQuery = req.query.search;
  const sortQuery = req.query.sort;
  const featured = req.query.featured;

  if (cat) {
    query.category = cat;
  }
  if (searchQuery) {
    query.title = { $regex: searchQuery, $options: "i" };
  }
  if(featured){
  query.isFeatured = true
  }
  if (author) {
    const user = await User.findOne({ username: author }, { _id: 1 });

    if (!user) {
      return res.status(404).json({ status: 404, message: "No post found" });
    }

    query.user = user._id;
  }

  let sortObj = { createdAt: -1 };
  if (sortQuery) {
    switch (sortQuery) {
      case "newest":
        sortObj = { createdAt: -1 };
        break;
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      case "popular":
        sortObj = { visits: -1 };
        break;
      case "trending":
        sortObj = { visits: -1 };
        query.createdAt = {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        };
        break;
      default:
        break;
    }
  }

  const posts = await Post.find(query)
    .limit(limit)
    .skip((page - 1) * limit)
    .sort(sortObj)
    .populate("user", "username");

  const totalPosts = await Post.countDocuments(query);
  const hasMore = page * limit < totalPosts;

  return res.status(200).json({
    status: 200,
    items: posts,
    hasMore,
    message: "successfully retrieved all posts",
  });
};
const updateAPost = async (req, res) => {};

const deleteAPost = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const postExist = await Post.findById(id);
  if (!postExist) {
    throw new ApiError(404, "No post available");
  }

  if (user.role === "admin") {
    await Post.findOneAndDelete({ _id: id });
    return res.status(200).json({
      status: 200,
      message: "successfully deleted",
    });
  }

  if (!postExist.user.equals(user._id)) {
    throw new ApiError(403, "You cannot delete this post");
  }

  const deleted = await Post.findOneAndDelete({ _id: id, user: req.user._id });
  if (!deleted) {
    throw new ApiError(500, "Error deleting the post");
  }

  return res.status(200).json({
    status: 200,
    message: "successfully deleted",
  });
};

const featurePost = async (req, res) => {
  const postId = req.body.postId;
  const user = req.user;

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ status: 404, message: "No such post exist" });
  }

  if (user.role !== "admin") {
    return res
      .status(403)
      .json({ status: 403, message: "You cannot feature this post" });
  }

  const isFeatured = post.isFeatured;

  const updatedPost = await Post.findByIdAndUpdate(
    post._id,
    { isFeatured: !isFeatured },
    { returnDocument: "after" },
  );

  return res.status(200).json({
    status: 200,
    post: updatedPost,
    message: updatedPost.isFeatured ? "Post featured" : "Post unFeatured",
  });
};

const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

const uploadAuth = async (req, res) => {
  const { token, expire, signature } =
    client.helper.getAuthenticationParameters();
  res.send({
    token,
    expire,
    signature,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  });
};

export {
  createPost,
  getSinglePost,
  getAllPosts,
  updateAPost,
  deleteAPost,
  uploadAuth,
  featurePost,
};
