import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    legacyNo: { type: String, index: true },
    quoteCode: { type: String, required: true, unique: true, trim: true },
    customer: {
      name: { type: String, required: true },
      attention: { type: String, default: "" },
      address: { type: String, required: true },
      tel: { type: String, required: true },
      email: { type: String, default: "" },
      taxOffice: { type: String, required: true }
    },
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", default: null },
    materialNameSnapshot: { type: String, required: true },
    thicknessMm: { type: Number, required: true },
    bendLengthMm: { type: Number, required: true },
    machineId: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", default: null },
    machineModelSnapshot: { type: String, required: true },
    toolingId: { type: mongoose.Schema.Types.ObjectId, ref: "Tooling", default: null },
    toolingNameSnapshot: { type: String, default: "" },
    selectedOptions: [
      {
        optionId: { type: mongoose.Schema.Types.ObjectId, ref: "Option", default: null },
        code: { type: String, required: true },
        name: { type: String, required: true },
        priceUsd: { type: Number, required: true }
      }
    ],
    machinePriceUsd: { type: Number, required: true },
    optionsTotalUsd: { type: Number, required: true },
    grandTotalUsd: { type: Number, required: true },
    notes: { type: String, default: "" },
    createdAtLegacy: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Quote = mongoose.model("Quote", quoteSchema);
