import express, { Request, Response } from "express";
import { userModel } from "../models/user";
import { lectureHallModel } from "../models/lectureHall";
import { sendEmail } from "../middlewares/email";

export const createNewHall = async (req: Request, res: Response) => {
  const { name } = req.body;
  const lectureHall = new lectureHallModel({ name });

  try {
    await lectureHall.save();
    res.status(201).send("Lecture hall created successfully");
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getAllHalls = async (req: Request, res: Response) => {
  const lectureHalls = await lectureHallModel.find();
  res.send(lectureHalls);
};

export const BookHall = async (req: Request, res: Response) => {
  const { hallId, time } = req.body;
  const bookedUntil = new Date(time);

  const lectureHall = await lectureHallModel.findById(hallId);
  if (!lectureHall) return res.status(404).send("Lecture hall not found");

  if (lectureHall.bookedUntil && lectureHall.bookedUntil > new Date()) {
    return res.status(400).send("Lecture hall is already booked");
  }

  lectureHall.bookedUntil = bookedUntil;

  try {
    await lectureHall.save();

    const students = await userModel.find({ role: "student" });
    const studentEmails = students.map((student) => student.email);

    const text = `Lecture hall ${lectureHall.name} has been booked until ${bookedUntil}`;

    sendEmail(studentEmails, "Requesting Password Reset", JSON.stringify(text));

    res.send("Lecture hall booked and students notified");
  } catch (error) {
    res.status(400).send(error);
  }
};
