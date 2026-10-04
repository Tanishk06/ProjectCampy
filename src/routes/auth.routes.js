import { Router } from "express";
import {
  forgotPasswordRequest,
  logOutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgotPassword,
  verifyEmail,
  getCurrentUser,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userResetForgotPasswordValidator,
  userForgotPasswordValidator,
} from "../validators/index.js";
import { login } from "../controllers/auth.controller.js";
import {
  userLoginValidator,
  userChangeCurrentPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//unsecure routes
router.route("/register").post(userRegisterValidator(), validate, registerUser); //If this router receives a POST request for /register, run registerUser.

router.route("/login").post(userLoginValidator(), validate, login); //If this router receives a POST request for /register, run registerUser.

router.route("/verify-email:verificationToken").get(verifyEmail);

router.route("/refresh-token").post(refreshAccessToken);

router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest); // it will run and all the error will get collected in validate

router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);

//secure routes
router.route("/logout").post(verifyJWT, logOutUser);

router.route("/current-user").post(verifyJWT, getCurrentUser);

router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    getCurrentUser,
  );

router
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification);
export default router;
