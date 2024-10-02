import express, { Router } from "express";
import cron from "node-cron";
import {
  BookHall,
  checkAllHallsAvailability,
  createNewHall,
  getAllHalls,
  getOneHall,
  updateHall,
} from "../controllers/lectureHall";
import { authenticate, authorize } from "../middlewares/authenticate";
import { helper } from "../helper";

cron.schedule("*/10 * * * *", async () => {
  console.log("Checking and updating hall availability...");
  await checkAllHallsAvailability();
});

export class HallRouter {
  private helperSvc: helper;
  router: Router;

  constructor() {
    this.helperSvc = new helper();
    this.router = Router();
    this.initRoute();
  }

  private initRoute() {
    this.router.get(
      "/halls",
      authenticate,
      this.helperSvc.routeHandler(getAllHalls)
    );
    this.router.get(
      "/hall/:id",
      authenticate,
      this.helperSvc.routeHandler(getOneHall as any)
    );
    this.router.post(
      "/create/hall",
      authenticate,
      authorize(["admin"]),
      this.helperSvc.routeHandler(createNewHall)
    );
    this.router.put(
      "/update/hall",
      authenticate,
      authorize(["admin"]),
      this.helperSvc.routeHandler(updateHall)
    );
    this.router.get(
      "/halls/availability",
      authenticate,
      this.helperSvc.routeHandler(checkAllHallsAvailability)
    );
    this.router.post(
      "/book/hall",
      authenticate,
      authorize(["classRep", "admin"]),
      this.helperSvc.routeHandler(BookHall as any)
    );
  }
}
