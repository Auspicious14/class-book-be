import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "student" | "classRep" | "admin";
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["student", "classRep", "admin"],
    },
    pushToken: { type: String },
  },
  { timestamps: true }
);

export const userModel = mongoose.model<IUser>("User", UserSchema);
