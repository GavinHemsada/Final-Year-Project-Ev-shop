import { Schema, model, Document, Types } from "mongoose";

export interface IFinancialProductType extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialProductTypeSchema = new Schema<IFinancialProductType>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const FinancialProductType = model<IFinancialProductType>(
  "FinancialProductType",
  FinancialProductTypeSchema
);
