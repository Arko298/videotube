import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import mongoose from "mongoose";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import multer from "../middlewares/multer.middleware.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json(new ApiError(400, "User already exists"));

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // if (!avatarLocalPath || !coverImageLocalPath) {
  //     throw new ApiError(400, "Please upload avatar and cover image");

  // }
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("uploaded avatar ", avatar);
  } catch (error) {
    console.log("Error uploading avatar", error);
    throw new ApiError(500, "Failed to load avatar");
  }
  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("uploaded cover image ", coverImage);
  } catch (error) {
    console.log("Error uploading cover image", error);
    throw new ApiError(500, "Failed to load cover image");
  }

  try {
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || null,
      email,
      password,
      username:
        fullName.split(" ")[0].toLowerCase() +
        fullName.split(" ")[1].toLowerCase() +
        Math.random().toString(36).substring(2, 15), // generate a random username
    });
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "Failed to create user");
    }
    res.status(201).json(new ApiResponse(201, "User created successfully"));
  } catch (error) {
    console.log("User creation failed");
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(500, "Failed to create user");
  }
});
const generateAccessandRefreshToken = asyncHandler(async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate access and refresh token");
  }
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password)
    return res
      .status(400)
      .json(new ApiError(400, "Please provide email, username and password"));
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user)
    return res.status(400).json(new ApiError(400, "Invalid email or username"));

  const isPasswordValid = await User.isPasswordCorrect(password);
  if (!isPasswordValid)
    return res.status(400).json(new ApiError(400, "Invalid password"));
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    User._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
});
const logoutUser= asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
      {
        $set:{
          refreshToken:undefined,
        }
      },
      {
        new:true,
      }
     )
     const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
     }
     return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new ApiResponse(200,{},"User logged out successfully"))

})
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshAccessToken;
  if (!incomingRefreshToken)
    return res.status(401).json(new ApiError(401, "No refresh token provided"));
  try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) return res.status(401).json(new ApiError(401, "User not found"));
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to refresh access token");
  }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordvalid=user.isPasswordCorrect(oldPassword);

  if (!isPasswordvalid){
    throw new ApiError(401,"Old password is incorrect");
  }
  user.password=newPassword;
  await user.save({validateBeforeSave:false});
  return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"));

    
});
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");
  if(!user){
    throw new ApiError(404,"User not found");
  }
  return res.status(200).json(new ApiResponse(200,{user},"User found successfully"));
});
const updateAccountDetails= asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "Please provide full name and email");
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      fullName,
      email: email,
    },
  }, {
    new: true,
  }).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, { user }, "Account details updated successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath=req.files?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload an avatar");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");}
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      avatar: avatar.url,
    },
  }, {
    new: true,
  }).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, { user }, "Avatar updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath){
    throw new ApiError(400,"Please provide a cover Image");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url){
    throw new ApiError(500,"Failed to upload cover image");
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      coverImage: coverImage.url,
    },
  }, {
    new: true,
  }).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, { user }, "Cover image updated successfully"));
});

const getUserChannelProfile= asyncHandler(async (req,res)=>{
  const {username}=req.params;

  if (!username?.trim()){
    throw new ApiError(400,"Please provide a username");
  }
  const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase(),
      }
    },
  ])


})
const getWatchHistory= asyncHandler(async (req,res)=>{

})


export default {
  registerUser,
  generateAccessandRefreshToken,
  refreshAccessToken,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
