import mongoose, { Document, Schema } from "mongoose";
import { BookingSchema, IBooking } from "./bookHall";

interface IFiles {
  name: string;
  uri: string;
  type: string;
}
export interface ILectureHall extends Document {
  name: string;
  description: string;
  location: string;
  capacity: string;
  available: boolean;
  images: IFiles[];
  bookings: IBooking[];
}

const LectureHallSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: false },
    description: { type: String },
    location: { type: String, required: false },
    capacity: { type: String, required: false },
    available: { type: Boolean, default: true },
    bookings: { type: [BookingSchema], default: [] },
    images: [
      { uri: { type: String }, name: { type: String }, type: { type: String } },
    ],
  },
  { timestamps: true }
);

export const lectureHallModel = mongoose.model<ILectureHall>(
  "LectureHall",
  LectureHallSchema
);
