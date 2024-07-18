import mongoose, { Document, Schema } from "mongoose";
import { BookingSchema, IBooking } from "./bookHall";

interface IFiles {
  name: string;
  uri: string;
  type: string;
}
export interface ILectureHall extends Document {
  name: string;
  location: string;
  images: IFiles[];
  bookings: IBooking[];
}

const LectureHallSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  bookings: { type: [BookingSchema], default: [] },
  images: [
    { uri: { type: String }, name: { type: String }, type: { type: String } },
  ],
});

export const lectureHallModel = mongoose.model<ILectureHall>(
  "LectureHall",
  LectureHallSchema
);
