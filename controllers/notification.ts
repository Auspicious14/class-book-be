import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import { IUser, userModel } from "../models/user";
import axios from "axios";
import jwt from "jsonwebtoken";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

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
// ) => {
//   try {
//     const users = await userModel
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

// const sendPushNotification = async (
//   pushToken: string,
//   hallName: string,
//   bookedBy: string,
//   bookedFrom: string,
//   bookedTo: string,
//   duration: string
// ) => {
//   try {
//     const message = {
//       to: pushToken,
//       sound: "default",
//       title: "Hall Booked!",
//       body: `${hallName} has just been booked by ${bookedBy}`,
//       data: `Lecture hall ${hallName}, has been booked by ${bookedBy}
//               from ${bookedFrom} until ${bookedTo}. The booking span ${duration} hours`,
//     };

//     const response = await axios(notificationApiUrl, {
//       method: "POST",
//       headers: {
//         Accept: "application/json",
//         "Accept-Encoding": "gzip, deflate",
//         "Content-Type": "application/json",
//       },
//       data: JSON.stringify(message),
//     });

//     console.log("Response from Expo:", response.data);

//     if (response.status !== 200 || response.data.errors) {
//       throw new Error(
//         response.data.errors
//           ? response.data.errors[0].message
//           : "Notification failed"
//       );
//     }

//     console.log(`Notification sent successfully`);
//   } catch (error: any) {
//     console.error(`Failed to send notification:`, error.message);

//     if (
//       error.message.includes("DeviceNotRegistered") ||
//       error.message.includes("InvalidCredentials")
//     ) {
//       await handleInvalidToken(pushToken);
//     }
//   }
// };

// export const sendBatchNotifications = async (
//   users: IUser[],
//   hallName: string,
//   bookedBy: string,
//   bookedFrom: string,
//   bookedTo: string,
//   duration: string
// ) => {
//   const MAX_BATCH_SIZE = 100;
//   let batches = [];

//   for (let i = 0; i < users.length; i += MAX_BATCH_SIZE) {
//     const batch = users.slice(i, i + MAX_BATCH_SIZE);
//     batches.push(batch);
//   }

//   for (const batch of batches) {
//     const notifications = batch.map((user) =>
//       sendPushNotification(
//         user.pushToken,
//         hallName,
//         bookedBy,
//         bookedFrom,
//         bookedTo,
//         duration
//       )
//     );
//     await Promise.all(notifications);
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

    await sendBatchNotifications(
      users,
      hallName,
      bookedBy,
      bookedFrom,
      bookedTo,
      duration
    );
  } catch (error: any) {
    console.error("Error sending notifications to users:", error.message);
  }
};

// const sendBatchNotifications = async (
//   users: IUser[],
//   hallName: string,
//   bookedBy: string,
//   bookedFrom: string,
//   bookedTo: string,
//   duration: string
// ): Promise<void> => {
//   let userId: string = "";
//   const messages: ExpoPushMessage[] = users
//     .map((user) => {
//       userId = (user._id as string).toString();
//       if (!Expo.isExpoPushToken(user.pushToken)) {
//         console.error(
//           `Push token ${user.pushToken} is not a valid Expo push token`
//         );
//         return null;
//       }
//       return {
//         to: user.pushToken,
//         sound: "default" as "default",
//         title: "Hall Booking Confirmed!",
//         body: `${hallName} has been booked by ${bookedBy} from ${new Date(
//           bookedFrom
//         ).toLocaleTimeString()} to ${new Date(
//           bookedTo
//         ).toLocaleTimeString()} (${duration} hours).`,
//         data: {
//           hallName,
//           bookedBy,
//           bookedFrom,
//           bookedTo,
//           duration,
//         },
//       };
//     })
//     .filter((msg): msg is NonNullable<typeof msg> => msg !== null);

//   const chunks = expo.chunkPushNotifications(messages);
//   const tickets: any[] = [];

//   for (let chunk of chunks) {
//     try {
//       const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//       console.log("tickets", ticketChunk);
//       tickets.push(...ticketChunk);
//     } catch (error) {
//       console.error(error);
//     }
//   }
//   setTimeout(() => {
//     tickets.forEach((ticket) => {
//       if (ticket.status === "ok" && ticket.userId) {
//         await handleNotificationReceipts(userId as string, tickets);
//       }
//     });
//   }, 10000);

// };
const sendBatchNotifications = async (
  users: IUser[],
  hallName: string,
  bookedBy: string,
  bookedFrom: string,
  bookedTo: string,
  duration: string
): Promise<void> => {
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
    return;
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
    setTimeout(async () => {
      await handleNotificationReceipts(userIds, tickets);
    }, 50000); // 10-second delay
  } else {
    console.warn(
      `Ticket count (${tickets.length}) doesn’t match user count (${userIds.length})`
    );
  }
};

const handleNotificationReceipts = async (
  userIds: string[],
  tickets: any[]
): Promise<void> => {
  const receiptIds = tickets
    .filter((ticket) => ticket.status === "ok" && ticket.id)
    .map((ticket) => ticket.id as string);

  if (!receiptIds.length) {
    console.warn("No valid receipt IDs to check");
    return;
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
        const ticketIndex = tickets.findIndex((t) => t.id === receiptId);
        const userId = ticketIndex !== -1 ? userIds[ticketIndex] : "unknown";

        if (receipt.status === "ok") {
          console.log(
            `Notification delivered successfully for user ${userId}, receipt ${receiptId}`
          );
        } else if (receipt.status === "error") {
          console.error(
            `Notification failed for user ${userId}, receipt ${receiptId}: ${receipt.message}`
          );
          if (receipt.details?.error) {
            console.error(`Error code for ${userId}: ${receipt.details.error}`);
            if (
              receipt.details.error === "DeviceNotRegistered" ||
              receipt.details.error === "InvalidCredentials"
            ) {
              await handleInvalidToken(userId, receiptId);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching receipts for chunk:", error);
    }
  }
};
// const handleNotificationReceipts = async (
//   userId: string,
//   tickets: any[]
// ): Promise<void> => {
//   const receiptIds = tickets
//     .filter((ticket) => ticket.status === "ok")
//     .map((ticket) => ticket.id);
//   console.log({ userId, receiptIds });
//   const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
//   for (let chunk of receiptIdChunks) {
//     try {
//       const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
//       console.log({ receipts });

//       for (let receiptId in receipts) {
//         const { status, message, details }: any = receipts[receiptId];
//         if (status === "error") {
//           console.error(
//             `There was an error sending a notification: ${message}`
//           );
//           if (details && details.error) {
//             console.error(`The error code is ${details.error}`);
//             if (
//               details.error === "DeviceNotRegistered" ||
//               details.error === "InvalidCredentials"
//             ) {
//               await handleInvalidToken(userId, receiptId);
//             }
//           }
//         }
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   }
// };

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
