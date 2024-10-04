import { Router } from "express";
import { helper } from "../helper";
import { addNotificationTokenToUser } from "../controllers/notification";
import { authenticate } from "../middlewares/authenticate";

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
      authenticate,
      this.helperSvc.routeHandler(addNotificationTokenToUser as any)
    );
  }
}
