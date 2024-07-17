import mongoose, { Document, Schema } from "mongoose";
import { BookingSchema, IBooking } from "./bookHall";

export interface ILectureHall extends Document {
  name: string;
  location: string;
  bookings: IBooking[];
}

const LectureHallSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  bookings: { type: [BookingSchema], default: [] },
});

export const lectureHallModel = mongoose.model<ILectureHall>(
  "LectureHall",
  LectureHallSchema
);
