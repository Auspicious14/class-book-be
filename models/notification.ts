import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "user" },
    pushToken: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const notificationModel = mongoose.model(
  "notification",
  notificationSchema
);
