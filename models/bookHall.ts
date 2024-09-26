import mongoose, { Schema, Types } from "mongoose";
import { ILectureHall } from "./lectureHall";

export interface IBooking extends ILectureHall {
  bookedFrom: Date | null;
  bookedTo: Date | null;
  duration: string | null;
}

export const BookingSchema: Schema = new Schema({
  bookedFrom: { type: Date, default: null },
  bookedTo: { type: Date, default: null },
  bookedBy: { type: mongoose.Types.ObjectId, ref: "user" },
  duration: { type: String, default: null },
});

export const BookLectureHallModel = mongoose.model<IBooking>(
  "booking",
  BookingSchema
);
