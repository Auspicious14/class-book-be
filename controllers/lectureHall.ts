import express, { Request, Response } from "express";
import { userModel } from "../models/user";
import { lectureHallModel } from "../models/lectureHall";
import { sendEmail } from "../middlewares/email";

export const createNewHall = async (req: Request, res: Response) => {
  const { name, location } = req.body;
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
  res.json({ data: lectureHalls });
};

export const BookHall = async (req: Request, res: Response) => {
  const { hallId, duration, bookedTo, bookedFrom } = req.body;
  const to = new Date(bookedTo);
  const from = new Date(bookedFrom);
  const classDuration = new Date(duration).getHours();

  const lectureHall = await lectureHallModel.findById(hallId);
  console.log(lectureHall, "lll");
  if (!lectureHall) return res.json("Lecture hall not found");
  if (to && to > new Date()) {
    return res.json("Lecture hall is already booked");
  }

  // lectureHall.bookedTo = to;

  try {
    // await lectureHall.save();

    const users = await userModel.find();
    const usersEmail = users.map((user) => user.email);
    console.log(usersEmail, "emails");

    const text = `Lecture hall ${lectureHall.name} has been booked ${from} until ${to}. The booking span ${classDuration} hours`;

    sendEmail(usersEmail, "Lecture Booked", JSON.stringify(text));

    res.json({ message: "Lecture hall booked and students notified" });
  } catch (error) {
    res.json(error);
  }
};
