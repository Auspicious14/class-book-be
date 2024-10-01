import dotenv from "dotenv";
dotenv.config();
import authRouter from "./routes/auth";
import hallRouter from "./routes/hall";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
export const appRoute = express();
import { ProfileRouter } from "./routes/profile";
import { NotificationRouter } from "./routes/notification";
const profileRouter = new ProfileRouter();
const notificationRouter = new NotificationRouter();

appRoute.use(cors());
appRoute.use(bodyParser.json());
appRoute.use(bodyParser.urlencoded({ extended: true }));
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
appRoute.use(profileRouter.router);
appRoute.use(notificationRouter.router);
