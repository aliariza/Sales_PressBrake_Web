import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    legacyNo: { type: String, index: true },
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    priceUsd: { type: Number, required: true }
  },
  { timestamps: true }
);

export const Option = mongoose.model("Option", optionSchema);
