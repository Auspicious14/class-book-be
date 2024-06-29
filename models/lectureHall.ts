import mongoose, { Document, Schema } from "mongoose";

export interface ILectureHall extends Document {
  name: string;
  location: string;
  bookedFrom: Date | null;
  bookedTo: Date | null;
  duration: string | null;
}

const LectureHallSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  bookedFrom: { type: Date, default: null },
  bookedTo: { type: Date, default: null },
  duration: { type: String, default: null },
  location: { type: String, required: true },
});

export const lectureHallModel = mongoose.model<ILectureHall>(
  "LectureHall",
  LectureHallSchema
);
