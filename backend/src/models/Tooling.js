import mongoose from "mongoose";

const toolingSchema = new mongoose.Schema(
  {
    legacyNo: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    vDieMm: { type: Number, required: true },
    punchRadiusMm: { type: Number, required: true },
    dieRadiusMm: { type: Number, required: true }
  },
  { timestamps: true }
);

export const Tooling = mongoose.model("Tooling", toolingSchema);
