import mongoose, { Schema } from "mongoose";

const subtasksSchema = new Schema(
  {
    subtaskTitle: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: Schema.type.ObjectId,
      ref: "Tasks",
      required: true,
    },
    createdBy: {
      type: Schema.type.ObjectId,
      ref: "User",
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Subtasks = mongoose.model("Subtasks", subtasksSchema);
