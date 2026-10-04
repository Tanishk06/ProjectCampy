import jwt from "jsonwebtoken";
import { User } from "../models/userModal.js";
import { Project } from "../models/project.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  console.log("Cookies:", req.cookies);
  console.log("Access Token:", req.cookies?.accessToken);
  console.log("Authorization:", req.header("Authorization"));

  if (!token) {
    throw new apiError(401, "Invalid request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!user) {
      throw new apiError(401, "Invalid access token");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new apiError(401, "Invalid access token");
  }
});

export const validateProjectPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      throw new apiError(404, "Project not found");
    }

    const member = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!member) {
      throw new apiError(404, "Member does not exist");
    }

    const givenRole = member?.role;

    req.user.role = givenRole;

    if (!roles.includes(givenRole)) {
      throw new apiError(
        403,
        "You do not have permission to perform this action",
      );
    }

    next();
  });
};
