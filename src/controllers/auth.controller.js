import { User } from "../models/userModal.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  emailVerficationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefrshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ ValiditeBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "something went wrong while generating access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exists", []);
  }

  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ ValiditeBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerficationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`, //generating dynamic link
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );
  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new apiResponse(
        200,
        { user: createdUser },
        "User registered successfully and verification email has been sent to your emailId",
      ),
    );
});

const login = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!email) {
    throw new apiError(400, "Username and email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(400, "User does not exists ");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefrshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user fetched successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new apiError(400, "Email verification token is missing");
  }
  const hashedToken = crypto
    .hash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new apiError(400, "Email verification token is missing");
  }

  user.emailVerificationExpiry = undefined;
  user.emailVerificationToken = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new apiResponse(
      200,
      {
        isEmailVerified: true,
      },
      "Email is verified",
    ),
  );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new apiError(409, "User does not exists");
  }

  if (user.isEmailVerified) {
    throw new apiError(409, "Email is already verified");
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken;

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Please verify you email",
    mailgenContent: emailVerficationMailgenContent(
      user.email,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Mail has been sent to your email ID"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized access");
  }

  try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken, //returns decoded payload if valid
      process.env.REFRESH_TOKEN_SCERET,
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefrshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    const options = {
      https: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, resfreshToken: newRefreshToken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new apiError(401, "Invalid refresh token");
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "User is does not exist");
  }

  const { hashedToken, unhashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.forgotPasswordExpiry = tokenExpiry;
  user.forgotPasswordToken = hashedToken;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unhashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset email has been sent"));
});

const resetForgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new apiError(489, "Token is invalid");
  }

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = User.findOne(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new apiError(400, "Invalid old password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

export {
  getCurrentUser,
  changeCurrentPassword,
  resetForgotPassword,
  forgotPasswordRequest,
  refreshAccessToken,
  resendEmailVerification,
  verifyEmail,
  registerUser,
  login,
  logOutUser,
};
