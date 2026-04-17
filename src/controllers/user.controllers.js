import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import * as arctic from "arctic";
import { OAUTH_EXCHANGE_EXPIRY } from "../constants.js";
import crypto from "node:crypto";
import { google } from "../utils/oauth/google.js";
import { env } from "../config/env.js";

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

const getGoogleLoginPage = async (req, res) => {
  const state = arctic.generateState();
  const codeVerifier = arctic.generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  res.cookie("google_oauth_state", state, options);
  res.cookie("google_code_verifier", codeVerifier, options);

  res.redirect(url.toString());
};
const oauthExchangeCodes = new Map();

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of oauthExchangeCodes) {
    if (now > entry.expiresAt) {
      oauthExchangeCodes.delete(code);
    }
  }
}, 5 * 60 * 1000);

const getGoogleLoginCallback = async (req, res) => {
  const { code, state } = req.query;

  const {
    google_oauth_state: storedState,
    google_code_verifier: codeVerifier,
  } = req.cookies;

  if (
    !code ||
    !state ||
    !storedState ||
    !codeVerifier ||
    state !== storedState
  ) {
    return res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`);
  }

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    return res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`);
  }

  const claims = arctic.decodeIdToken(tokens.idToken());
  const { sub: googleUserId, email, picture } = claims;

  let user = await User.findOne({ email });

  if (user) {
    user.avatar = picture;
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
      avatar: picture,
      provider: "google",
      providerAccountId: googleUserId,
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const exchangeCode = crypto.randomUUID();

  oauthExchangeCodes.set(exchangeCode, {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 60 * 1000,
  });

  return res.status(200).redirect(`${env.CLIENT_URL}/?code=${exchangeCode}`);
};

const exchangeOAuthCode = async (req, res) => {
  const { code } = req.body;
  const entry = oauthExchangeCodes.get(code);

  if (!entry) {
    throw new ApiError(401, "Invalid or expired exchange code");
  }

  if (Date.now() > entry.expiresAt) {
    oauthExchangeCodes.delete(code);
    throw new ApiError(401, "Exchange code expired");
  }

  oauthExchangeCodes.delete(code);

  const { accessToken, refreshToken } = entry;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({ status: 200, message: "OAuth exchange successful" });
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
  getCurrentUser,
  getGoogleLoginPage,
  getGoogleLoginCallback,
  logoutUser,
  deleteUser,
  getSavedPosts,
  savePost,
  oauthExchangeCodes,
  exchangeOAuthCode
};
