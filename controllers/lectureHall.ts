import express, { Request, Response } from "express";
import { userModel } from "../models/user";
import { lectureHallModel } from "../models/lectureHall";
import { sendEmail } from "../middlewares/email";
import { mapFiles } from "../middlewares/uploadImage";

export const createNewHall = async (req: Request, res: Response) => {
  const { name, location, capacity, available, files } = req.body;
  try {
    const existingHall = await lectureHallModel.findOne({ name, location });
    if (existingHall) res.json({ message: "Lecture Hall already exists" });

    const fls = await mapFiles(files);
    if (!fls) res.json({ message: "Error uploading image" });

    const lectureHall = new lectureHallModel({
      name,
      location,
      capacity,
      available,
      images: fls,
    });
    await lectureHallModel.syncIndexes();
    await lectureHall.save();

    res.json({
      message: "Lecture hall created successfully",
      data: lectureHall,
    });
  } catch (error) {
    res.json(error);
  }
};

export const updateHall = async (req: Request, res: Response) => {
  const { _id, name, location, capacity, available, files } = req.body;

  try {
    const existingHall = await lectureHallModel.findById(_id);
    if (!existingHall) res.json({ message: "Lecture Hall does not exists" });

    const fls = await mapFiles(files);
    if (!fls) res.json({ message: "Error uploading image" });

    const lectureHall = await lectureHallModel.findOneAndUpdate(
      { _id },
      { name, location, capacity, available, images: fls },
      { new: true }
    );
    await lectureHallModel.syncIndexes();

    res.json({
      message: "Lecture hall updated successfully",
      data: lectureHall,
    });
  } catch (error) {
    res.json(error);
  }
};

export const getAllHalls = async (req: Request, res: Response) => {
  const lectureHalls = await lectureHallModel.find();
  res.json({ data: lectureHalls });
};

export const BookHall = async (req: Request, res: Response) => {
  const { hallId, duration, bookedTo, bookedFrom } = req.body;
  const classDuration = new Date(duration).getHours();

  const bookedFromDate = new Date(bookedFrom);
  const bookedToDate = new Date(bookedTo);

  if (bookedFromDate < new Date()) {
    return res.json({ message: "Booking start time must be in the future" });
  }

  if (bookedToDate <= bookedFromDate) {
    return res.json({
      message: "Booking end time must be after the start time",
    });
  }

  try {
    const lectureHall = await lectureHallModel.findById(hallId);

    if (!lectureHall) {
      return res.status(404).json("Lecture hall not found");
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
      return res
        .status(400)
        .json("Lecture hall is already booked for the requested time");
    }

    const newBooking = {
      bookedFrom: bookedFromDate,
      bookedTo: bookedToDate,
      duration: classDuration,
    };

    await lectureHallModel.updateOne(
      { _id: hallId },
      { $push: { bookings: newBooking } }
    );

    const users = await userModel.find();
    const usersEmail = users.map((user) => user.email);

    const text = `Lecture hall ${lectureHall.name} has been booked ${bookedFrom} until ${bookedTo}. 
                  The booking span ${classDuration} hours`;

    sendEmail(usersEmail, "Lecture Booked", JSON.stringify(text));

    res.json({ message: "Lecture hall booked and students notified", text });
  } catch (error) {
    res.json(error);
  }
};

// if i book a hall at around Wed 2pm to 4pm and ttodays date is Wed 1pm
// stat is 2pm
// stop is 4pm - same day
// if start is less than current date and stop is greater than current date then hall is booked
// if start is greater than current date and stop is less than current date then hall cannot be booked
// 2 < 13 && 4
