const dotenv = require("dotenv");
dotenv.config();
import authRouter from "./routes/auth";
import hallRouter from "./routes/hall";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
const cookieParser = require("cookie-parser");
export const appRoute = express();

appRoute.use(cors());
appRoute.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow_Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
appRoute.use(express.json({ limit: "50mb" }));
appRoute.use(express.urlencoded({ limit: "50mb", extended: true }));
appRoute.use(cookieParser());
// appRoute.use(express.json());
appRoute.use("/auth", authRouter);
appRoute.use(hallRouter);
