import mongoose, { Document, Schema } from "mongoose";

export interface ILectureHall extends Document {
  name: string;
  bookedUntil: Date | null;
}

const LectureHallSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  bookedUntil: { type: Date, default: null },
});

export const lectureHallModel = mongoose.model<ILectureHall>(
  "LectureHall",
  LectureHallSchema
);
