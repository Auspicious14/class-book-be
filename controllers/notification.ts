import { Request, Response } from "express";
import { userModel } from "../models/user";
import axios from "axios";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;
const notificationApiUrl = process.env.EXPO_NOTIFICATION_API_URL || "";

export const addNotificationTokenToUser = async (
  req: Request,
  res: Response
) => {
  const { pushToken } = req.body;

  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json("Access Denied. Unauthenticated.");

    const verifyAuth: any = jwt.verify(token, jwtSecret as string);
    if (!verifyAuth) res.json({ messaage: "Access Denied. Unauthenticated." });

    const user = await userModel
      .findByIdAndUpdate(
        verifyAuth?._id,
        { $set: { pushToken } },
        { new: true }
      )
      .select("-password");

    if (!user) return res.json({ success: false, message: "No user found" });

    res.json({ success: true, message: "Push Token saved" });
  } catch (error) {
    res.json({ success: false, error });
  }
};

export const bookingNotification = async (hallName: string) => {
  try {
    const users = await userModel
      .find({ pushToken: { $exists: true } })
      .select("firstName lastName pushToken");

    if (!users.length) {
      console.log("No users found with push tokens.");
      return;
    }

    await sendBatchNotifications(users, hallName);
  } catch (error: any) {
    console.error("Error sending notifications to users:", error.message);
  }
};

const sendPushNotification = async (pushToken: string, hallName: string) => {
  try {
    const message = {
      to: pushToken,
      sound: "default",
      title: "Hall Booked!",
      body: `${hallName} has just been booked`,
    };

    const response = await axios(notificationApiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      data: JSON.stringify(message),
    });

    const responseData: any = await response.data;

    if (response.statusText != "ok" || responseData.error) {
      throw new Error(responseData.error || "Notification failed");
    }

    console.log(`Notification sent successfully to ${pushToken}`);
  } catch (error: any) {
    console.error(
      `Failed to send notification to ${pushToken}:`,
      error.message
    );

    if (
      error.message.includes("DeviceNotRegistered") ||
      error.message.includes("InvalidCredentials")
    ) {
      await handleInvalidToken(pushToken);
    }
  }
};

export const sendBatchNotifications = async (
  users: any[],
  hallName: string
) => {
  const MAX_BATCH_SIZE = 100;
  let batches = [];

  for (let i = 0; i < users.length; i += MAX_BATCH_SIZE) {
    const batch = users.slice(i, i + MAX_BATCH_SIZE);
    batches.push(batch);
  }

  for (const batch of batches) {
    const notifications = batch.map((user) =>
      sendPushNotification(user.pushToken, hallName)
    );
    await Promise.all(notifications);
  }
};

const handleInvalidToken = async (pushToken: string) => {
  try {
    await userModel.updateOne({ pushToken }, { $unset: { pushToken: "" } });
    console.log(`Invalid push token removed: ${pushToken}`);
  } catch (error: any) {
    console.error("Error removing invalid push token:", error.message);
  }
};
