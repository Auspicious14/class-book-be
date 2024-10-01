import { Request, Response } from "express";
import { userModel } from "../models/user";
import { notificationModel } from "../models/notification";

export const addNotificationToken = async (req: Request, res: Response) => {
  const { userId, pushToken } = req.body;

  try {
    if (!userId) return res.json({ success: false, message: "Bad User Input" });

    const user = await userModel.findById(userId).select("-password");
    if (!user) return res.json({ success: false, message: "No user found" });

    const notification = new notificationModel({
      pushToken,
      userId: user?._id,
    });
    res.json({ success: true, message: "Push Token saved" });
  } catch (error) {
    res.json({ success: false, error });
  }
};
