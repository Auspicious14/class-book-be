import mongoose, { Document, Schema } from "mongoose";

export interface ILectureHall extends Document {
  name: string;
  location: string;
}

const LectureHallSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
});

export const lectureHallModel = mongoose.model<ILectureHall>(
  "LectureHall",
  LectureHallSchema
);
