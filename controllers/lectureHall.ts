import express, { Request, Response } from "express";
import { userModel } from "../models/user";
import { lectureHallModel } from "../models/lectureHall";
import { sendEmail } from "../middlewares/email";
import { mapFiles } from "../middlewares/uploadImage";
import jwt from "jsonwebtoken";
import { bookingNotification } from "./notification";
import { formatDate } from "../middlewares/formatDate";

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

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lecture Hall Booking Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7; color: #2d3748;">
      <!-- Container -->
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto;">
        
        <!-- Header -->
        <tr>
          <td style="padding: 20px 0; text-align: center;">
            <h1 style="font-size: 28px; color: #2d3748; margin: 0; font-weight: 700;">HallMate</h1>
            <p style="font-size: 14px; color: #718096; margin: 5px 0 0;">Your Lecture Hall Booking Updates</p>
          </td>
        </tr>

        <!-- Body Card -->
        <tr>
          <td style="background-color: #ffffff; border-radius: 10px; padding: 25px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="font-size: 18px; color: #2d3748; margin: 0 0 15px; font-weight: 600;">Booking Confirmed</h2>
            <p style="font-size: 15px; color: #718096; margin: 0 0 20px; line-height: 1.4;">
              A lecture hall has been reserved. Here are the details:
            </p>

            <!-- Details Section -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;">
                  <span style="font-size: 14px; color: #718096;">Hall</span><br>
                  <span style="font-size: 16px; color: #2d3748; font-weight: 600;">${
                    lectureHall.name
                  }</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;">
                  <span style="font-size: 14px; color: #718096;">Booked By</span><br>
                  <span style="font-size: 16px; color: #2d3748; font-weight: 600;">${
                    authorizedUser?.firstName
                  } ${authorizedUser?.lastName || ""}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;">
                  <span style="font-size: 14px; color: #718096;">Start Time</span><br>
                  <span style="font-size: 16px; color: #2d3748; font-weight: 600;">${formatDate(
                    bookedFrom
                  )}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;">
                  <span style="font-size: 14px; color: #718096;">End Time</span><br>
                  <span style="font-size: 16px; color: #2d3748; font-weight: 600;">${formatDate(
                    bookedTo
                  )}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <span style="font-size: 14px; color: #718096;">Duration</span><br>
                  <span style="font-size: 16px; color: #2d3748; font-weight: 600;">${duration} hours</span>
                </td>
              </tr>
            </table>

           
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 20px 0; text-align: center;">
            <p style="font-size: 12px; color: #718096; margin: 0;">© ${new Date().getFullYear()} HallMate. All rights reserved.</p>
            <p style="font-size: 12px; color: #718096; margin: 5px 0 0;">
              Questions? <a href="mailto:support@hallmate.com" style="color: #4299e1; text-decoration: none;">Contact Support</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

    const text = `Lecture hall ${lectureHall.name}, has been booked by ${authorizedUser?.firstName} from ${bookedFrom} until ${bookedTo}. 
                  The booking span ${duration} hours`;

    const sentMail = await sendEmail(
      usersEmail,
      "Lecture Hall Booking Confirmed - HallMate",
      JSON.stringify(text),
      htmlContent
    );
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
