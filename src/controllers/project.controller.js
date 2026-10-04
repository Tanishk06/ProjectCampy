import { User } from "../models/userModal.js";
import { Project } from "../models/project.models.js";
import {
  getProjectMembers,
  ProjectMember,
} from "../models/projectmember.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  emailVerficationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

//from          → Which collection?
//localField    → Which field from CURRENT collection?
//foreignField  → Which field from OTHER collection?
//as            → What should I call the resulting array?

/*
ProjectMember collection
        │
        │
        ▼
     $match
 "only current user's
  memberships"
        │
        ▼
 ┌─────────────────┐
 │ ProjectMember   │
 │ project = P1    │
 └─────────────────┘
        │
        │ $lookup
        │
        │ local: projects
        │ foreign: _id
        ▼
 ┌─────────────────┐
 │ Project P1      │
 │                 │
 │ inner lookup    │
 │       ↓         │
 │ find members    │
 │       ↓         │
 │ members = 5     │
 └─────────────────┘
        │
        │ as: "project"
        ▼
 project: [ P1 ]
        │
        │ $unwind
        ▼
 project: P1
        │
        │ $project
        ▼
keep only:
project._id
project.name
project.description
project.members
project.createdAt
project.createdBy
role
        │
        ▼
aggregation result
        │
        ▼
const projects
        │
        ▼
res.json()  */

const getProject = asyncHandler(async (req, res) => {
  const projects = ProjectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "projects", //MongoDB, go look inside the projects collection.
        localField: "projects", //Take the projects field from this current ProjectMember document.
        foreignField: "_id",
        as: "projects", //"Take whatever documents come out of this lookup + its pipeline and put them into a field called projects."
        pipeline: [
          //The inner pipeline is operating on the project document that was found.
          {
            $lookup: {
              from: "projectmembers",
              localField: "_id",
              foreignField: "projects",
              as: "projectmembers",
            },
          },
          {
            $addFields: {
              members: {
                size: "$projectmembers",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$project",
    },
    {
      $project: {
        project: {
          _id: 1,
          name: 1,
          description: 1,
          members: 1,
          createdAt: 1,
          createdBy: 1,
        },
        role: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiPesponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new apiError(404, "Project not found");
  }
  return res
    .status(200)
    .json(new apiResponse(200, project, "Project fetched successfully"));

});

/** 
After $match

You have multiple documents:

[
  {
    project: "P1",
    user: "U1",
    role: "member"
  },
  {
    project: "P1",
    user: "U2",
    role: "admin"
  },
  {
    project: "P1",
    user: "U3",
    role: "member"
  }
]
$lookup runs for EACH document

For the first member:

user: "U1"

becomes:

user: [
  {
    _id: "U1",
    username: "Alice"
  }
]

For the second:

user: "U2"

becomes:

user: [
  {
    _id: "U2",
    username: "Bob"
  }
]

For the third:

user: "U3"

becomes:

user: [
  {
    _id: "U3",
    username: "Charlie"
  }
]

So the pipeline temporarily looks like:

[
  {
    project: "P1",
    user: [
      { _id: "U1", username: "Alice" }
    ]
  },

  {
    project: "P1",
    user: [
      { _id: "U2", username: "Bob" }
    ]
  },

  {
    project: "P1",
    user: [
      { _id: "U3", username: "Charlie" }
    ]
  }
]

Then:

$arrayElemAt: ["$user", 0]

is applied separately to each document:

Member 1: user[0] → Alice
Member 2: user[0] → Bob
Member 3: user[0] → Charlie

So after $addFields:

[
  {
    project: "P1",
    user: { _id: "U1", username: "Alice" },
    role: "member"
  },

  {
    project: "P1",
    user: { _id: "U2", username: "Bob" },
    role: "admin"
  },

  {
    project: "P1",
    user: { _id: "U3", username: "Charlie" },
    role: "member"
  }
]
**/

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = Project.findById(req.params);

  if (!project) {
    throw new apiError(404, "Project not found");
  }

  const ProjectMembers = await ProjectMember.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: {
          $arrayElemAt: ["$user", 0],
        },
      },
    },
    {
      $project: {
        project: 1,
        user: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, ProjectMembers, "Project Members fetched"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      name,
      description,
    },
    { new: true },
  );

  if (!project) throw new apiError(404, "Project not found");

  return res
    .status(201)
    .json(new apiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  await Project.findByIdAndDelete(projectId);

  if (!project) throw new apiError(404, "Project not found");

  return res
    .status(200)
    .json(new apiResponse(200, projectMember, "Project deleted successfully"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { newRole } = req.body;

  if (!AvailableUserRole.includes(newRole)) {
    throw new apiError(400, "Invalid Role");
  }

  let projectMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new apiError(404, "Project member not found");
  }

  projectMember = await projectMember.findByIdAndUpdate(
    projectMember._id,
    {
      role: newRole,
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .json(new apiResponse(200, "ProjectMember role updated successfully"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const project = await Project.create({
    name,
    description,
    createdBy: new mongoose.Types.ObjectId(req.body._id),
  });
  await ProjectMember.create({
    user: new mongoose.Types.ObjectId(req.body._id),
    project: new mongoose.Types.ObjectId(project._id),
    role: UserRolesEnum.ADMIN,
  });

  return res
    .status(201)
    .json(new apiResponse(201, project, "Project created successfully"));
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.body;

  const projectMember = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(userId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!projectMember) {
    throw new apiError(404, "Member does not exist");
  }

  await ProjectMember.findByIdAndDelete(projectMember._id);

  return res
    .status(200)
    .json(new apiResponse(200, "Member removed successfully"));
});

const addMembersToProject = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;

  const user = await User.findOne({ email }); //

  if (!user) {
    throw new apiError(404, "User don't exist");
  }

  await ProjectMember.findOneAndUpdate(
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
    },
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
      role: role,
    },
    {
      new: true, //gives us updated document
      upsert: true, //creates a new document if none exists
    },
  );
  return res
    .status(201)
    .json(new apiResponse(201, {}, "Project member added successfully"));
});

export {
  getProject,
  getProjectById,
  getProjectMembers,
  updateProject,
  deleteProject,
  updateMemberRole,
  createProject,
  deleteMember,
  addMembersToProject,
};
