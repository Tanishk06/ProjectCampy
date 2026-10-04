import mongoose, { Schema } from "mongoose";

const projectNoteSchema = new Schema(
  {
    project: {
      type: Schema.type.ObjectId,
      ref: "Project",
      required: true,
    },
    createdBy: {
      type: Schema.type.ObjectId,
      ref: "ProjectMember",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export const ProjectNote = mongoose.model("ProjectNote", projectNoteSchema);
