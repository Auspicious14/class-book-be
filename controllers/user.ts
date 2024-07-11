import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../models/user";
import { generateOTP } from "../middlewares/generateOtp";
import { sendEmail } from "../middlewares/email";

export const signUp = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) res.json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });
    await user.save();
    res.json({ message: "Registered successfully" });
  } catch (error) {
    res.json(error);
  }
};

export const Login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    process.env.JWT_SECRET!
  );
  res.json({
    data: {
      _id: user?._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user?.email,
      role: user?.role,
    },
    token,
    message: "Login successully",
  });
};

export const forgetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user: any = await userModel.findOne({ email });
    if (!user)
      return res.json({
        success: false,
        message: "Account with the email does not exist",
      });
    const { otp, otpDate } = generateOTP();
    user.manageOTP.otp = otp;
    user.manageOTP.otpDate = otpDate;
    await user.save();
    const message = `<div>Dear ${user?.lastName}</div> <br /> <div>Your verification code is ${otp}</div><br /> <div>Verification code will expire within 1hr</div>`;
    sendEmail(user.email, "Requesting Password Reset", JSON.stringify(message));

    res.json({
      success: true,
      message: `Check your mail for your verification code`,
    });
  } catch (error) {
    res.json({ error });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp: userOtp } = req.body;
  try {
    const user: any = await userModel.findOne({ email });
    if (!user)
      return res.json({
        success: false,
        message: "Account not found",
      });
    const { otp, otpDate } = user.manageOTP;
    const expiryDate = otpDate + 60 * 60 * 1000;

    if (otp !== userOtp)
      return res.json({
        success: false,
        message: "Incorrect OTP",
      });

    if (expiryDate < Date.now())
      return res.json({
        success: false,
        message: "OTP expired",
      });
    res.json({
      verified: true,
    });
  } catch (error) {
    res.json({ error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;

  try {
    const user: any = await userModel.findOne({ email });
    if (!user)
      return res.json({
        success: false,
        message: "Account not found",
      });

    const oldPassword = user.password;
    const comparePassword = await bcrypt.compare(oldPassword, newPassword);

    if (comparePassword)
      return res.json({
        success: false,
        message: "You entered your old password",
      });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({
      success: true,
      message: "Password successfully changed.",
    });
  } catch (error) {
    res.json({ error });
  }
};
