import mongoose, { Schema, Types } from "mongoose";
import { ILectureHall } from "./lectureHall";

export interface IBooking extends ILectureHall {
  bookedFrom: Date;
  bookedTo: Date;
  duration: string;
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
