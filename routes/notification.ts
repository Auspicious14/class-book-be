import { Router } from "express";
import { helper } from "../helper";
import { addNotificationToken } from "../controllers/notifiication";

export class NotificationRouter {
  private helperSvc: helper;
  router: Router;

  constructor() {
    this.helperSvc = new helper();
    this.router = Router();
    this.initRoute();
  }

  private initRoute() {
    this.router.get(
      "/notification/save-token",
      this.helperSvc.routeHandler(addNotificationToken as any)
    );
  }
}
