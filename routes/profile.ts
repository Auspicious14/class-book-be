import { Router } from "express";
import { helper } from "../helper";
import { getProfile } from "../controllers/profile";

export class ProfileRouter {
  private helperSvc: helper;
  router: Router;

  constructor() {
    this.helperSvc = new helper();
    this.router = Router();
    this.initRoute();
  }

  private initRoute() {
    this.router.get("/profile", this.helperSvc.routeHandler(getProfile as any));
  }
}
