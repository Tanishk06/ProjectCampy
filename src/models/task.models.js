import mongoose, { Schema, SchemaType } from "mongoose";
import { AvailableTaskStatuses, TaskStatusEnum } from "../utils/constants.js";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    assignedTo: {
      type: Schema.type.ObjectId,
      ref: "User",
    },

    assignedBy: {
      type: Schema.type.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: AvailableTaskStatuses,
      default: TaskStatusEnum.TODO,
    },
    attachments: {
      type: [
        {
          url: String,
          size: Number,
          mimeType: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const Tasks = mongoose.model("Tasks", taskSchema);
