import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJwt = asyncHandler(async (req, _, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies.token;
  if (!token) {
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  }
 
  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -refreshToken");
    if (!user){
      throw new ApiError(401, "User not authorized");}
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  }
});