import express from "express";
import {
  BookHall,
  createNewHall,
  getAllHalls,
} from "../controllers/lectureHall";
import { authenticate, authorize } from "../middlewares/authenticate";
const router = express.Router();

router.post(
  "/create/hall",
  authenticate,
  authorize(["classRep"]),
  createNewHall
);
router.get("/halls", authenticate, getAllHalls);
router.post("/book", authenticate, authorize(["classRep"]), BookHall);

export default router;
