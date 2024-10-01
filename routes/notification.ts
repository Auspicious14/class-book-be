import { Router } from "express";
import { helper } from "../helper";
import { addNotificationTokenToUser } from "../controllers/notification";

export class NotificationRouter {
  private helperSvc: helper;
  router: Router;

  constructor() {
    this.helperSvc = new helper();
    this.router = Router();
    this.initRoute();
  }

  private initRoute() {
    this.router.put(
      "/notification/save-token",
      this.helperSvc.routeHandler(addNotificationTokenToUser as any)
    );
  }
}
