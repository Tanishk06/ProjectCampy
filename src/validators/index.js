import { body } from "express-validator";
import { AvailableUserRole } from "../utils/constants.js";

const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be in lower case")
      .isLength({ min: 3 })
      .withMessage("Username must have atleast three characters"),

    body("password").trim().notEmpty().withMessage("Password is required"),

    body("fullName").optional().trim(),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Email is invalid"),

    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword").notEmpty().withMessage("New password is required"),
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};

const userResetForgotPasswordValidator = () => {
  return [body("newPassword").notEmpty().withMessage("Password is required")];
};

const createProjectValidator = () => {
  return [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name of the project is required"),

    body("description").optional(),
  ];
};

const addMemberToProjectValidator = () => {
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .trim()
      .isEmail()
      .withMessage("Email is invalid"),

    body("role")
      .notEmpty()
      .withMessage("Role should be specified")
      .isIn(AvailableUserRole)
      .withMessage("Role is invalid"),
  ];
};

export {
  userResetForgotPasswordValidator,
  userForgotPasswordValidator,
  userChangeCurrentPasswordValidator,
  userRegisterValidator,
  userLoginValidator,
  createProjectValidator,
  addMemberToProjectValidator,
};
