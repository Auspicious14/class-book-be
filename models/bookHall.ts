import mongoose, { Document, Schema } from "mongoose";
import { ILectureHall } from "./lectureHall";

export interface IBookLectureHall extends ILectureHall {
  name: string;
  location: string;
  bookedFrom: Date | null;
  bookedTo: Date | null;
  duration: string | null;
}

const BookLectureHallSchema: Schema = new Schema({
  name: { type: String, required: true },
  bookedFrom: { type: Date, default: null },
  bookedTo: { type: Date, default: null },
  duration: { type: String, default: null },
  location: { type: String, required: true },
});

export const lectureHallModel = mongoose.model<IBookLectureHall>(
  "LectureHall",
  BookLectureHallSchema
);
