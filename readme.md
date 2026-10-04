# 🚀 ProjectCampy

> A backend-first project management platform built with Node.js, Express.js, and MongoDB.

ProjectCampy is a RESTful backend designed to help teams organize projects, manage members, assign tasks, create subtasks, handle authentication, and work with file attachments.

The project focuses on understanding how a real-world backend is structured — from authentication and authorization to MongoDB relationships, aggregation pipelines, validation, file uploads, and email services.

---

## ✨ Features

## 🔎 MongoDB Aggregation Pipelines

ProjectCampy uses **MongoDB Aggregation Pipelines** to retrieve,
join, filter, and transform data across multiple collections.

The project uses aggregation stages such as:

- `$match`
- `$lookup`
- `$unwind`
- `$project`

These pipelines are used to work with relationships between:

````text
User
  │
  ▼
ProjectMember
  │
  ▼
Project
  │
  ├── Tasks
  │     └── Subtasks
  │
  └── Members

### 🔐 Authentication & Authorization

- User registration and login
- JWT-based authentication
- Access & refresh token system
- HTTP-only authentication cookies
- Logout functionality
- Current user retrieval
- Email verification
- Resend email verification
- Forgot password flow
- Reset password functionality
- Change password
- Protected routes
- Role-based project permissions

### 📁 Project Management

- Create projects
- Retrieve projects for the authenticated user
- Retrieve project details
- Update project details
- Delete projects
- Add members to projects
- Remove project members
- Update member roles
- Retrieve project members
- Project-level authorization

### ✅ Task Management

- Create tasks
- Retrieve project tasks
- Retrieve individual tasks
- Update tasks
- Delete tasks
- Assign tasks to users
- Track task status
- Add task attachments
- Create subtasks
- Update subtasks
- Mark subtasks as completed
- Delete subtasks

### 📎 File Uploads

ProjectCampy uses **Multer** to handle multipart file uploads.

Uploaded files are processed by the backend and their relevant metadata is associated with tasks as attachments.

### 📧 Email Services

Email-related workflows are implemented using:

- Nodemailer
- Mailgen

These are used for:

- Email verification
- Password recovery
- Verification emails

### 🛡️ Validation & Error Handling

- Request validation with `express-validator`
- Centralized API error handling
- Custom API error responses
- Async controller handling
- Reusable authentication middleware
- Standardized API responses

---

# 🧰 Tech Stack

| Technology            | Purpose               |
| --------------------- | --------------------- |
| **Node.js**           | JavaScript runtime    |
| **Express.js**        | REST API framework    |
| **MongoDB**           | Database              |
| **Mongoose**          | MongoDB ODM           |
| **JWT**               | Authentication        |
| **bcrypt**            | Password hashing      |
| **Multer**            | File uploads          |
| **Nodemailer**        | Email delivery        |
| **Mailgen**           | Email templates       |
| **express-validator** | Request validation    |
| **cookie-parser**     | Cookie handling       |
| **CORS**              | Cross-origin requests |
| **dotenv**            | Environment variables |
| **Prettier**          | Code formatting       |
| **Nodemon**           | Development server    |

---

# 🏗️ Project Architecture

ProjectCampy follows a modular backend structure where responsibilities are separated into controllers, models, routes, middleware, validators, utilities, and database configuration.

```text
ProjectCampy/
│
├── src/
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── healthCheckController.js
│   │   ├── project.controller.js
│   │   └── task.controller.js
│   │
│   ├── db/
│   │   └── dbindex.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── multer.middleware.js
│   │   └── validator.middleware.js
│   │
│   ├── models/
│   │   ├── note.models.js
│   │   ├── project.models.js
│   │   ├── projectmember.models.js
│   │   ├── subtask.models.js
│   │   ├── task.models.js
│   │   └── userModal.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── healthCheckRouter.js
│   │   └── project.routes.js
│   │
│   ├── utils/
│   │   ├── apiError.js
│   │   ├── apiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── constants.js
│   │   └── mail.js
│   │
│   ├── validators/
│   │   └── index.js
│   │
│   └── index.js
│
├── public/
│   └── images/
│
├── .env
├── .gitignore
├── .prettierignore
├── .prettierrc
├── package.json
└── package-lock.json
````
