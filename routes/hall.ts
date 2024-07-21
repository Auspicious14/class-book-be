import express from "express";
import {
  BookHall,
  createNewHall,
  getAllHalls,
  updateHall,
} from "../controllers/lectureHall";
import { authenticate, authorize } from "../middlewares/authenticate";
const router = express.Router();

router.post("/create/hall", authenticate, authorize(["admin"]), createNewHall);
router.put("/update/hall", authenticate, authorize(["admin"]), updateHall);
router.get("/halls", authenticate, getAllHalls);
router.post(
  "/book/hall",
  authenticate,
  authorize(["classRep", "admin"]),
  BookHall
);

export default router;
