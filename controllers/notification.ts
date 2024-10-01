import { Request, Response } from "express";
import { userModel } from "../models/user";

const notificationApiUrl = process.env.EXPO_NOTIFICATION_API_URL || "";

export const addNotificationTokenToUser = async (
  req: Request,
  res: Response
) => {
  const { userId, pushToken } = req.body;

  try {
    if (!userId) return res.json({ success: false, message: "Bad User Input" });

    const user = await userModel
      .findByIdAndUpdate(userId, { $set: { pushToken } }, { new: true })
      .select("-password");

    if (!user) return res.json({ success: false, message: "No user found" });

    res.json({ success: true, message: "Push Token saved" });
  } catch (error) {
    res.json({ success: false, error });
  }
};

export const bookingNotification = async (hallName: string) => {
  const users = await userModel.find();

  users.map(
    async (user: any) =>
      await sendPushNotification(
        {
          firstName: user.firstName,
          lastName: user.lastName,
          pushToken: user.pushToken,
        },
        hallName
      )
  );
};

const sendPushNotification = async (
  user: { firstName: string; lastName: string; pushToken: string },
  hallName = "A hall"
) => {
  const message = {
    to: user.pushToken,
    sound: "default",
    title: "Hall Booked!",
    body: `${hallName} has just been booked by ${user.firstName} ${user.lastName}`,
  };

  await fetch(notificationApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
};
