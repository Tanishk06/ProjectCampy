import { User } from "../models/userModal.js";
import { Project } from "../models/project.models.js";
import { Tasks } from "../models/task.models.js";
import { SubTasks } from "../models/subtask.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const getTasks = asyncHandler(async (req, res) => {
   
     const {projectId} = req.params;

     const project = await Project.findById(projectId);

     if(!project){
        throw new apiError(404, "Project not found")
     }

     const tasks = await Tasks.find({
        project: new mongoose.Types.ObjectId(projectId)
     }).populate("assignedTo", "avatar username fullName")  //Follow this reference and bring me the related document

     return res
     .status(201)
     .json(new apiResponse(201, tasks, "Here is the task."))

});

/** USER'S LAPTOP
    │
    │ uploads bug.png
    ↓
HTTP REQUEST
    │
    ↓
MULTER
    │
    ├── saves ACTUAL FILE
    │       ↓
    │   public/images/1759-bug.png
    │
    └── creates FILE INFORMATION
            ↓
        req.files
            │
            ↓
        YOUR CONTROLLER
            │
            ↓
        attachments object
            │
            ↓
        DATABASE
**/

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new apiError(404, "Project not found");
  }

  const files = req.files || [];  //req.files is NOT the actual file itself.It is information/metadata about the file that Multer processed.

  const attachments = files.map((file) => {     //the files that Multer received and converting them into the attachment objects you want to save/use in your application.
    return {
      url: `${process.env.SERVER_URL}/images/${file.originalname}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  const task = await Tasks.create({
    title,
    description,
    project : new mongoose.Types.ObjectId(projectId),
    assignedTo : assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
    status,
    assignedBy : new mongoose.Types.ObjectId(req.user._id)
  })

  return res
  .status(201)
  .json(
    new apiResponse(201, task, "Task created successfully")
  )
});

const getTaskById = asyncHandler(async (req, res) => {
  const {taskId} = req.params

  const task = await Tasks.aggregate([
    {
      $match: {
        id: new mongoose.Types.ObjectId(taskId)
      },
    },
    {
      $lookup: {
         from : "users",
         foreignField: "_id",
         localField: "assignedTo",
         as: "assignedTo",
         pipeline: [
          {
             _id : 1,
             username: 1,
             fullName : 1,
             avatar : 1,
          }
         ]
      }
    },
    {
        $lookup: {
         from : "subtasks",
         foreignField: "task",
         localField: "_id",
         as: "subtasks",
         pipeline: [
          {
            $lookup : {
              from : "users",
              foreignField: "_id",
              localField: "createdBy",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id : 1,
                    username : 1,
                    fullName: 1,
                    avatar: 1,
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              createdBy : {
                $arrayElemAt : ["$createdBy", 0]
              }
            }
          }
         ]
      }
    },
   {
    $addFields: {
      assignedTo: {
        $arrayElemAt: ["$assignedTo", 0]
      }
    }
   }
  ])

  if(!task || task.length == 0){
    throw new apiError(404, "Task not Found")
  }

  return res
  .status(200)
  .json(new apiResponse(200,task[0], "Task fetched successfully"))
});

const updateTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new apiError(404, "Project not found");
  }

  const files = req.files || [];
  
  const attachments = files.map((file) => {
    return {
      url : `${process.env.SERVER_URL}/images/${file.originalname}`,
      mimetype : file.mimetype,
      size : file.size
    }
  })
  
  const task = await Tasks.findOneAndUpdate(
  {
    project : new mongoose.Types.ObjectId(projectId),
    title : title
  },
  {
   //$set and $push are MongoDB update operators
    $set : {  //$set = "make this field equal to this value"
      title,  
      description,
      project : new mongoose.Types.ObjectId(projectId),
      assignedTo : assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
      status,
    },
    $push : {  //So $push doesn't replace the array. It adds to it.
      attachments : {
        $each : attachments  //Push every item in this array individually.
      }
    }  
  },
  {
    new : true
  }
)
  
  if(!task){
    throw new apiError(404,"Task not found")
  }
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        task,
        "Task updated successfully"
      )
    );
  
});

const deleteTask = asyncHandler(async (req, res) => {
  const {projectId} = req.params;
  const {title} = req.body;

  const project = await Project.findById(projectId);
  if(!project){
    throw new apiError(404,"Project not found")
  }

  const task = await Tasks.findOneAndDelete(
    {
     project : new mongoose.Types.ObjectId(projectId),
     title : title
    }
)
  
   if(!task){
   throw new apiError(404,"Task not found")
   }

  return res
  .status(200)
  .json(new apiResponse(200,{},"Task deleted successfuly"))
});

const createSubTask = asyncHandler(async (req, res) => {
  const {projectId, title} = req.params;
  const {subtaskTitle} = req.body;

  const project = await Project.findById(projectId);
  if(!project){
    throw new apiError(404,"Project not found")
  }

  const task = await Tasks.findOne(
    {
      project : new mongoose.Types.ObjectId(projectId),
      title : title
    }
  )

  if(!task){
    throw new apiError(404,"Task not found")
  }


  const subtask = await SubTasks.create({
    subtaskTitle : subtaskTitle,
    task : task._id,
    createdBy : new mongoose.Types.ObjectId(req.user._id),
    completed : false,
  })

  return res
  .status(200)
  .json(new apiResponse(200, subtask, "Subtask created successfully"))
});

const updateSubTask = asyncHandler(async (req, res) => {
  const {projectId, title, oldSubtaskTitle} = req.params;
  const {subtaskTitle,completed} = req.body;

  const project = await Project.findById(projectId);
  if(!project){
    throw new apiError(404,"Project not found")
  }

  const task = await Tasks.findOne(
    {
      project : new mongoose.Types.ObjectId(projectId),
      title : title
    }
  )

  if(!task){
    throw new apiError(404,"Task not found")
  }

  const updatedSubtask = await SubTasks.findOneAndUpdate(
    {
      task : task._id,
      subtaskTitle :  oldSubtaskTitle,
    },
    {
      subtaskTitle,
      completed
    },
    {
      new : true
    }
  )

  return res
  .status(200)
  .json(new apiResponse(200, updatedSubtask, "Updated subtask successfully"));

});

const deleteSubTask = asyncHandler(async (req, res) => {
  const {projectId, title} = req.params;
  const {subtaskTitle} = req.body;

  const project = await Project.findById(projectId);
  if(!project){
    throw new apiError(404,"Project not found")
  }

  const task = await Tasks.findOne(
    {
      project : new mongoose.Types.ObjectId(projectId),
      title : title
    }
  )

  if(!task){
    throw new apiError(404,"Task not found")
  }
   
  const subtask = await SubTasks.findOneAndDelete(
    {
      task : task._id,
      subtaskTitle : subtaskTitle
    }
  )
   if(!subtask){
    throw new apiError(404, "Subtask not found");
   }

  return res
  .status(200)
  .json(new apiResponse(200, "Subtask deleted successfully"));
});

export {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
};
