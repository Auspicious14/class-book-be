import { Request, Response, NextFunction } from "express";
import { userModel } from "../models/user";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json("Access Denied. No token provided.");

  try {
    const verifyAuth: any = jwt.verify(token, jwtSecret as string);
    if (!verifyAuth) res.json({ messaage: "Access Denied. Unauthenticated." });

    const profile = await userModel
      .findById(verifyAuth._id)
      .select("-password");
    res.json({ success: true, data: profile });
  } catch (error) {
    res.json({ success: false, error });
  }
};
