import { Request, Response, Router } from "express";
import dotenv from "dotenv";
dotenv.config();
import { IUser, userModel } from "../models/user";
import axios from "axios";
import jwt from "jsonwebtoken";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

const router = Router();
let expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true,
});
const jwtSecret = process.env.JWT_SECRET;
const notificationApiUrl =
  process.env.EXPO_NOTIFICATION_API_URL ||
  "https://exp.host/--/api/v2/push/send";

export const addNotificationTokenToUser = async (
  req: Request,
  res: Response
) => {
  const { pushToken } = req.body;

  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json("Access Denied. Unauthenticated.");

    const verifyAuth: any = jwt.verify(token, jwtSecret as string);
    if (!verifyAuth) res.json({ messaage: "Access Denied. Unauthenticated." });

    const user = await userModel
      .findByIdAndUpdate(
        verifyAuth?._id,
        { $set: { pushToken } },
        { new: true }
      )
      .select("-password");

    if (!user) return res.json({ success: false, message: "No user found" });

    res.json({ success: true, message: "Push Token saved" });
  } catch (error) {
    res.json({ success: false, error });
  }
};

// export const bookingNotification = async (
//   hallName: string,
//   bookedBy: string,
//   bookedFrom: string,
//   bookedTo: string,
//   duration: string
// ): Promise<void> => {
//   try {
//     const users: IUser[] = await userModel
//       .find({ pushToken: { $exists: true } })
//       .select("firstName lastName pushToken");

//     if (!users.length) {
//       return;
//     }

//     await sendBatchNotifications(
//       users,
//       hallName,
//       bookedBy,
//       bookedFrom,
//       bookedTo,
//       duration
//     );
//   } catch (error: any) {
//     console.error("Error sending notifications to users:", error.message);
//   }
// };
// const sendBatchNotifications = async (
//   users: IUser[],
//   hallName: string,
//   bookedBy: string,
//   bookedFrom: string,
//   bookedTo: string,
//   duration: string
// ): Promise<void> => {
//   console.log(
//     `Starting notification batch for ${hallName}, ${users.length} users`
//   );

//   const messages: ExpoPushMessage[] = [];
//   const userIds: string[] = [];

//   // Build messages and track userIds
//   users.forEach((user) => {
//     const userId = (user._id as string).toString();
//     if (!user.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
//       console.error(
//         `Invalid or missing push token for user ${userId}: ${user.pushToken}`
//       );
//       return;
//     }
//     console.log(
//       `Preparing message for user ${userId}, token: ${user.pushToken}`
//     );
//     messages.push({
//       to: user.pushToken,
//       sound: "default" as const,
//       title: "Hall Booking Confirmed!",
//       body: `${hallName} has been booked by ${bookedBy} from ${new Date(
//         bookedFrom
//       ).toLocaleTimeString([], {
//         hour: "numeric",
//         minute: "2-digit",
//       })} to ${new Date(bookedTo).toLocaleTimeString([], {
//         hour: "numeric",
//         minute: "2-digit",
//       })} (${duration} hours).`,
//       data: { hallName, bookedBy, bookedFrom, bookedTo, duration },
//     });
//     userIds.push(userId);
//   });

//   if (!messages.length) {
//     console.warn("No valid messages to send");
//     return;
//   }

//   // Send notifications in chunks
//   const chunks = expo.chunkPushNotifications(messages);
//   const tickets: any[] = [];

//   for (const chunk of chunks) {
//     try {
//       console.log(`Sending chunk of ${chunk.length} notifications`);
//       const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//       console.log("Tickets received:", ticketChunk);
//       tickets.push(...ticketChunk);
//     } catch (error) {
//       console.error("Error sending notification chunk:", error);
//     }
//   }

//   // Schedule receipt check
//   if (tickets.length && tickets.length === userIds.length) {
//     console.log(`Scheduling receipt check for ${tickets.length} tickets`);
//     setTimeout(() => {
//       handleNotificationReceipts(userIds, tickets).catch((err) =>
//         console.error("Receipt check failed:", err)
//       );
//     }, 5000); // 5-second delay
//   } else {
//     console.warn(
//       `Ticket count (${tickets.length}) doesn’t match user count (${userIds.length})`
//     );
//   }
// };

// const handleNotificationReceipts = async (
//   userIds: string[],
//   tickets: any[]
// ): Promise<void> => {
//   const receiptIds = tickets
//     .filter((ticket) => ticket.status === "ok" && ticket.id)
//     .map((ticket) => ticket.id as string);

//   if (!receiptIds.length) {
//     console.warn("No valid receipt IDs to check");
//     return;
//   }

//   console.log("Receipt IDs to check:", receiptIds);
//   console.log("Corresponding user IDs:", userIds);

//   const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
//   for (const chunk of receiptIdChunks) {
//     try {
//       console.log(`Fetching receipts for chunk: ${chunk}`);
//       const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
//       console.log("Receipts received:", receipts);

//       for (const receiptId in receipts) {
//         const receipt = receipts[receiptId];
//         const ticketIndex = tickets.findIndex((t) => t.id === receiptId);
//         const userId = ticketIndex !== -1 ? userIds[ticketIndex] : "unknown";

//         if (receipt.status === "ok") {
//           console.log(
//             `Notification delivered successfully for user ${userId}, receipt ${receiptId}`
//           );
//         } else if (receipt.status === "error") {
//           console.error(
//             `Notification failed for user ${userId}, receipt ${receiptId}: ${receipt.message}`
//           );
//           if (receipt.details?.error) {
//             console.error(`Error code for ${userId}: ${receipt.details.error}`);
//             if (
//               receipt.details.error === "DeviceNotRegistered" ||
//               receipt.details.error === "InvalidCredentials"
//             ) {
//               await handleInvalidToken(userId, receiptId);
//             }
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching receipts for chunk:", error);
//     }
//   }
// };

// const handleInvalidToken = async (
//   userId: string,
//   pushToken: string
// ): Promise<void> => {
//   try {
//     await userModel.updateOne(
//       { _id: userId, pushToken },
//       { $unset: { pushToken: "" } }
//     );
//     console.log(`Invalid push token removed`);
//   } catch (error: any) {
//     console.error("Error removing invalid push token:", error.message);
//   }
// };

export const bookingNotification = async (
  hallName: string,
  bookedBy: string,
  bookedFrom: string,
  bookedTo: string,
  duration: string
): Promise<void> => {
  try {
    const users: IUser[] = await userModel
      .find({ pushToken: { $exists: true } })
      .select("firstName lastName pushToken");

    if (!users.length) {
      return;
    }

    const { userIds, tickets } = await sendBatchNotifications(
      users,
      hallName,
      bookedBy,
      bookedFrom,
      bookedTo,
      duration
    );

    if (userIds?.length > 0 && tickets?.length > 0) {
      fetch(
        `${
          process.env.VERCEL_URL || "https://hallmate-be.vercel.app"
        }/check-receipts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds, tickets }),
        }
      ).catch((err) => console.error("Receipt trigger failed:", err));
    }
  } catch (error: any) {
    console.error("Error sending notifications to users:", error.message);
  }
};

const sendBatchNotifications = async (
  users: IUser[],
  hallName: string,
  bookedBy: string,
  bookedFrom: string,
  bookedTo: string,
  duration: string
): Promise<{ userIds: string[]; tickets: any[] }> => {
  console.log(
    `Starting notification batch for ${hallName}, ${users.length} users`
  );

  const messages: ExpoPushMessage[] = [];
  const userIds: string[] = [];

  // Build messages and track userIds
  users.forEach((user) => {
    const userId = (user._id as string).toString();
    if (!user.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
      console.error(
        `Invalid or missing push token for user ${userId}: ${user.pushToken}`
      );
      return;
    }
    console.log(
      `Preparing message for user ${userId}, token: ${user.pushToken}`
    );
    messages.push({
      to: user.pushToken,
      sound: "default" as const,
      title: "Hall Booking Confirmed!",
      body: `${hallName} has been booked by ${bookedBy} from ${new Date(
        bookedFrom
      ).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })} to ${new Date(bookedTo).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })} (${duration} hours).`,
      data: { hallName, bookedBy, bookedFrom, bookedTo, duration },
    });
    userIds.push(userId);
  });

  if (!messages.length) {
    console.warn("No valid messages to send");
    return { userIds: [], tickets: [] };
  }

  // Send notifications in chunks
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: any[] = [];

  for (const chunk of chunks) {
    try {
      console.log(`Sending chunk of ${chunk.length} notifications`);
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("Tickets received:", ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error("Error sending notification chunk:", error);
    }
  }

  // Schedule receipt check
  if (tickets.length && tickets.length === userIds.length) {
    console.log(`Scheduling receipt check for ${tickets.length} tickets`);
    setTimeout(() => {
      // handleNotificationReceipts(userIds, tickets).catch((err) =>
      //   console.error("Receipt check failed:", err)
      // );
    }, 5000); // 5-second delay
  } else {
    console.warn(
      `Ticket count (${tickets.length}) doesn’t match user count (${userIds.length})`
    );
  }
  return { userIds, tickets };
};

router.post("/check-receipts", async (req, res) => {
  const { userIds, tickets } = req.body;
  console.log("Receipt check endpoint hit");
  try {
    const receiptIds = tickets
      .filter((ticket: any) => ticket.status === "ok" && ticket.id)
      .map((ticket: any) => ticket.id as string);

    if (!receiptIds.length) {
      console.warn("No valid receipt IDs to check");
      return res.status(200).json({ message: "No receipts to check" });
    }

    console.log("Receipt IDs to check:", receiptIds);
    console.log("Corresponding user IDs:", userIds);

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of receiptIdChunks) {
      try {
        console.log(`Fetching receipts for chunk: ${chunk}`);
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log("Receipts received:", receipts);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          const ticketIndex = tickets.findIndex((t: any) => t.id === receiptId);
          const userId = ticketIndex !== -1 ? userIds[ticketIndex] : "unknown";

          if (receipt.status === "ok") {
            console.log(
              `Notification delivered for user ${userId}, receipt ${receiptId}`
            );
          } else if (receipt.status === "error") {
            console.error(
              `Notification failed for user ${userId}, receipt ${receiptId}: ${receipt.message}`
            );
            if (receipt.details?.error) {
              console.error(
                `Error code for ${userId}: ${receipt.details.error}`
              );
              if (
                receipt.details.error === "DeviceNotRegistered" ||
                receipt.details.error === "InvalidCredentials"
              ) {
                await handleInvalidToken(userId, receiptId); // Use token from message
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching receipts for chunk:", error);
      }
    }
    console.log("Receipt check completed");
    res.status(200).json({ message: "Receipts checked" });
  } catch (error) {
    console.error("Error in /check-receipts:", error);
    res.status(500).json({ error: "Failed to check receipts" });
  }
});

const handleInvalidToken = async (
  userId: string,
  pushToken: string
): Promise<void> => {
  try {
    await userModel.updateOne(
      { _id: userId, pushToken },
      { $unset: { pushToken: "" } }
    );
    console.log(`Invalid push token removed`);
  } catch (error: any) {
    console.error("Error removing invalid push token:", error.message);
  }
};
