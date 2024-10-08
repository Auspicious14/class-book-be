import express, { Request, Response } from "express";
import { userModel } from "../models/user";
import { lectureHallModel } from "../models/lectureHall";
import { sendEmail } from "../middlewares/email";
import { mapFiles } from "../middlewares/uploadImage";
import jwt from "jsonwebtoken";
import { bookingNotification } from "./notification";

const jwtSecret = process.env.JWT_SECRET;

export const createNewHall = async (req: Request, res: Response) => {
  const { name, location, capacity, description, available, files } = req.body;
  try {
    const existingHall = await lectureHallModel.findOne({ name, location });
    if (existingHall) res.json({ message: "Lecture Hall already exists" });

    const fls = await mapFiles(files);
    if (!fls) res.json({ message: "Error uploading image" });

    const lectureHall = new lectureHallModel({
      name,
      description,
      location,
      capacity,
      available: true,
      images: fls,
    });
    await lectureHallModel.syncIndexes();
    await lectureHall.save();

    res.json({
      message: "Lecture hall created successfully",
      data: lectureHall,
    });
  } catch (error) {
    res.json({ success: false, error });
  }
};

export const updateHall = async (req: Request, res: Response) => {
  const { _id, name, location, capacity, description, available, files } =
    req.body;
  try {
    const existingHall = await lectureHallModel.findById(_id);
    if (!existingHall) res.json({ message: "Lecture Hall does not exists" });

    const fls = await mapFiles(files);
    if (!fls) res.json({ message: "Error uploading image" });

    const lectureHall = await lectureHallModel.findOneAndUpdate(
      { _id },
      { name, description, location, capacity, available, images: fls },
      { new: true }
    );
    await lectureHallModel.syncIndexes();

    res.json({
      message: "Lecture hall updated successfully",
      data: lectureHall,
    });
  } catch (error) {
    res.json({ success: false, error });
  }
};

export const getAllHalls = async (req: Request, res: Response) => {
  const { name, available } = req.query;
  try {
    let query: any = {};

    if (name) query.name = { $regex: name, $options: "i" };
    if (available) query.available = available;

    const lectureHalls = await lectureHallModel.find(query);
    res.json({ data: lectureHalls });
  } catch (error) {
    res.json({ success: false, error });
  }
};

export const getOneHall = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!id || id == "")
      res.json({ success: false, message: "Bad User Input" });

    const hall = await lectureHallModel.findById(id);
    if (!hall)
      return res.json({
        success: false,
        message: "Lecture Hall does not exist",
      });

    res.json({ success: true, data: hall });
  } catch (error) {
    res.json({ success: false, error });
  }
};

export const BookHall = async (req: Request, res: Response) => {
  const { hallId, duration, bookedTo, bookedFrom } = req.body;
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).send("Access Denied. No token provided.");

  try {
    const verifyAuth: any = jwt.verify(token, jwtSecret as string);
    if (!verifyAuth) res.json({ messaage: "Access Denied. Unauthenticated." });

    const authorizedUser = await userModel.findById(verifyAuth?._id);
    if (!authorizedUser) res.json({ success: false, messaage: "Unauthorised" });

    const bookedFromDate = new Date(bookedFrom).toISOString();
    const bookedToDate = new Date(bookedTo).toISOString();

    if (bookedFromDate < new Date().toISOString()) {
      return res.json({ message: "Booking start time must be in the future" });
    }

    if (bookedToDate <= bookedFromDate) {
      return res.json({
        message: "Booking end time must be after the start time",
      });
    }

    const lectureHall = await lectureHallModel.findById(hallId);

    if (!lectureHall) {
      return res
        .status(404)
        .json({ success: false, error: "Lecture hall not found" });
    }

    const overlappingBooking = await lectureHallModel.findOne({
      _id: hallId,
      $or: [
        {
          "bookings.bookedFrom": { $lt: bookedToDate },
          "bookings.bookedTo": { $gt: bookedFromDate },
        },
      ],
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        error: "Lecture hall is already booked for the requested time",
      });
    }

    const newBooking = {
      bookedFrom: bookedFromDate,
      bookedTo: bookedToDate,
      duration,
      bookedBy: authorizedUser?._id,
    };

    await lectureHallModel.findByIdAndUpdate(
      hallId,
      {
        $push: { bookings: newBooking },
        $set: { available: false },
      },
      { new: true }
    );

    const users = await userModel.find();
    const usersEmail = users.map((user) => user.email);

    const text = `Lecture hall ${lectureHall.name}, has been booked by ${authorizedUser?.firstName} from ${bookedFrom} until ${bookedTo}. 
                  The booking span ${duration} hours`;

    const sentMail = await sendEmail(
      usersEmail,
      "Lecture Booked",
      JSON.stringify(text)
    );
    // console.log({ sentMail });
    await bookingNotification(
      lectureHall.name,
      authorizedUser?.firstName as string,
      bookedFrom,
      bookedTo,
      duration
    );
    res.json({
      success: true,
      message: "Lecture hall booked and students notified",
      text,
    });
  } catch (error) {
    res.json({ success: false, error });
  }
};

export const checkAllHallsAvailability = async () => {
  try {
    const halls = await lectureHallModel.find();

    for (const hall of halls) {
      const lastBooking = hall.bookings[hall.bookings.length - 1];

      if (lastBooking && new Date(lastBooking.bookedTo) < new Date()) {
        if (!hall.available) {
          hall.available = true;
          await hall.save();
          console.log(`Updated availability for hall: ${hall.name}`);
        }
      } else {
        if (hall.available) {
          hall.available = false;
          await hall.save();
          console.log(`Updated unavailability for hall: ${hall.name}`);
        }
      }
    }
  } catch (error) {
    console.error("Error checking and updating hall availability:", error);
  }
};

// if i book a hall at around Wed 2pm to 4pm and ttodays date is Wed 1pm
// stat is 2pm
// stop is 4pm - same day
// if start is less than current date and stop is greater than current date then hall is booked
// if start is greater than current date and stop is less than current date then hall cannot be booked
// 2 < 13 && 4
