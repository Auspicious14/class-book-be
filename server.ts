import dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import mongoose from "mongoose";
import { appRoute } from "./index";

const port = process.env.PORT || 5000;
const URI: any = process.env.MONGODB_URL;
mongoose
  .connect(URI)
  .then(() =>
    app.listen(port, () => console.log(`server is listening on port ${port}`))
  )
  .catch((err: any) => console.log(err));

app.use(appRoute);
