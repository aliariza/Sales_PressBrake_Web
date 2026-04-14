import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    legacyNo: { type: String, index: true },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], required: true },
    comments: { type: String, default: "" }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
