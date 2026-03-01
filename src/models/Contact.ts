import mongoose, { Document, Schema } from "mongoose";

export interface IContact extends Document {
  phoneNumber: string | null;
  email: string | null;
  linkedId: mongoose.Types.ObjectId | null;
  linkPrecedence: "primary" | "secondary";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const ContactSchema = new Schema<IContact>(
  {
    phoneNumber: { type: String, default: null },
    email: { type: String, default: null },
    linkedId: { type: Schema.Types.ObjectId, ref: "Contact", default: null },
    linkPrecedence: {
      type: String,
      enum: ["primary", "secondary"],
      required: true,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // auto manages createdAt & updatedAt
  }
);

export const Contact = mongoose.model<IContact>("Contact", ContactSchema);
