import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    legacyNo: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    tensileStrengthMPa: { type: Number, required: true },
    yieldStrengthMPa: { type: Number, required: true },
    kFactorDefault: { type: Number, required: true },
    youngsModulusMPa: { type: Number, required: true },
    recommendedVdieFactor: { type: Number, required: true },
    minThicknessMm: { type: Number, required: true },
    maxThicknessMm: { type: Number, required: true }
  },
  { timestamps: true }
);

export const Material = mongoose.model("Material", materialSchema);
