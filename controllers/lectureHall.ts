import express, { Request, Response } from "express";
import { userModel } from "../models/user";
import { lectureHallModel } from "../models/lectureHall";
import { sendEmail } from "../middlewares/email";

export const createNewHall = async (req: Request, res: Response) => {
  const { name, location } = req.body;
  console.log(name, location);
  const lectureHall = new lectureHallModel({ name, location });

  try {
    await lectureHall.save();
    res.json({
      message: "Lecture hall created successfully",
      data: {
        _id: lectureHall._id,
        name: lectureHall.name,
        location: lectureHall.location,
      },
    });
  } catch (error) {
    res.json(error);
  }
};

export const getAllHalls = async (req: Request, res: Response) => {
  const lectureHalls = await lectureHallModel.find();
  res.json(lectureHalls);
};

export const BookHall = async (req: Request, res: Response) => {
  const { hallId, time } = req.body;
  const to = new Date(time);

  const lectureHall = await lectureHallModel.findById(hallId);
  if (!lectureHall) return res.status(404).send("Lecture hall not found");

  if (lectureHall.bookedTo && lectureHall.bookedTo > new Date()) {
    return res.status(400).send("Lecture hall is already booked");
  }

  lectureHall.bookedTo = to;

  try {
    await lectureHall.save();

    const students = await userModel.find({ role: "student" });
    const studentEmails = students.map((student) => student.email);

    const text = `Lecture hall ${lectureHall.name} has been booked until ${to}`;

    sendEmail(studentEmails, "Requesting Password Reset", JSON.stringify(text));

    res.send("Lecture hall booked and students notified");
  } catch (error) {
    res.status(400).send(error);
  }
};
