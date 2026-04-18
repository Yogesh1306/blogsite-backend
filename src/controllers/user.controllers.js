import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { OAUTH_EXCHANGE_EXPIRY } from "../constants.js";

const options = {
  httpOnly: true,
  secure: true,
  maxAge: OAUTH_EXCHANGE_EXPIRY,
  sameSite: "none",
};

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already exist");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  res.status(200).json({
    status: 200,
    user: createdUser,
    message: "User registered successfully",
  });
};
const loginUser = async (req, res) => {
  const { loginInput, password } = req.body;

  const userAvailable = await User.findOne({
    $or: [
      { username: loginInput.trim().toLowerCase() },
      { email: loginInput.trim().toLowerCase() },
    ],
  });
  if (!userAvailable) {
    throw new ApiError(404, "No user with this username");
  }

  const isPasswordCorrect = await userAvailable.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    userAvailable._id,
  );
  const loggedInUser = await User.findById(userAvailable._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      status: 200,
      user: loggedInUser,
      message: "User logged in successfully",
    });
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
    message: "User fetched successfully",
  });
};

const googleLogin = async (req, res) => {
  const {email, avatar, googleUserId } = req.body;

  if (!( email && avatar && googleUserId)) {
    throw new ApiError(400, "Login credential missing!");
  }

  let user = await User.findOne({ email });

  if (user) {
    user.avatar = avatar;
    user.provider = "google";
    user.providerAccountId = googleUserId;
    await user.save();
  } else {
    const base = email
      .split("@")[0]
      .toLowerCase()
      .replaceAll(/[^a-z0-9]/g, "");
    const username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;

    user = await User.create({
      username,
      email,
      avatar,
      provider: "google",
      providerAccountId: googleUserId,
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({ status: 200, user: updatedUser });
};

const githubLogin = async (req, res) => {
  const {email, avatar, githubUserId } = req.body;

  if (!( email && avatar && githubUserId)) {
    throw new ApiError(400, "Login credential missing!");
  }

  let user = await User.findOne({ email });

  if(user.provider === "google"){
    throw new ApiError(402, "User already registered with another provided!")
  }

  if (user) {
    user.avatar = avatar;
    user.provider = "github";
    user.providerAccountId = githubUserId;
    await user.save();
  } else {
    const base = email
      .split("@")[0]
      .toLowerCase()
      .replaceAll(/[^a-z0-9]/g, "");
    const username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;

    user = await User.create({
      username,
      email,
      avatar,
      provider: "github",
      providerAccountId: githubUserId,
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({ status: 200, user: updatedUser });
};

const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { returnDocument: "after" },
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ status: 200, message: "User logged out" });
};
const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ status: 200, message: "User deleted successfully" });
};
const getSavedPosts = async (req, res) => {
  const user = req.user;
  return res.status(200).json({
    status: 200,
    posts: user.savedPosts,
    message: "saved posts retrieved successfully",
  });
};
const savePost = async (req, res) => {
  const user = req.user;
  const postId = req.body.postId;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "No such post exist");
  }

  const isSaved = user.savedPosts.some((p) => post._id.equals(p));

  if (isSaved) {
    await User.findByIdAndUpdate(user._id, {
      $pull: { savedPosts: post._id },
    });
  } else {
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { savedPosts: post._id },
    });
  }

  return res.status(200).json({
    status: 200,
    message: isSaved ? "Post unsaved" : "Post saved",
  });
};

export {
  registerUser,
  loginUser,
  githubLogin,
  getCurrentUser,
  googleLogin,
  logoutUser,
  deleteUser,
  getSavedPosts,
  savePost,
};
