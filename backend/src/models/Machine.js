import mongoose from "mongoose";

const machineSchema = new mongoose.Schema(
  {
    legacyNo: { type: String, index: true },
    model: { type: String, required: true, trim: true },
    maxTonnageTonf: { type: Number, required: true },
    workingLengthMm: { type: Number, required: true },
    maxThicknessMm: { type: Number, required: true },
    basePriceUSD: { type: Number, required: true }
  },
  { timestamps: true }
);

export const Machine = mongoose.model("Machine", machineSchema);
