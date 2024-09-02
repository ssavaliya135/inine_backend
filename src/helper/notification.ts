// import { messaging } from "firebase-admin";

// export const sendNotification = async (notification) => {
//   const tokens = removeEmptyToken(notification.tokens, ["", null, undefined]);
//   console.log("sendNotification -> tokens");

//   if (tokens.length) {
//     messaging()
//       .sendMulticast(notification)
//       .then(async (response) => {
//         console.log(
//           "Notification Send Successfully....",
//           new Date(),
//           notification.data.type
//         );
//         console.log(response, "@@@@@@@");

//         // Handle invalid tokens
//         const invalidTokens = [];
//         // response.forEach((resp, idx) => {
//         //   if (!resp.success) {
//         //     console.log(resp.error);
//         //     console.log("Failed to send notification to", tokens[idx]);
//         //     const errorCode = resp.error ? resp.error.code : null;
//         //     if (
//         //       errorCode === "messaging/invalid-registration-token" ||
//         //       errorCode === "messaging/registration-token-not-registered"
//         //     ) {
//         //       invalidTokens.push(tokens[idx]);
//         //     }
//         //   } else {
//         //     console.log(
//         //       "Successfully sent notification toooooooooooooooooooooooooooooooooooo",
//         //       tokens[idx]
//         //     );
//         //   }
//         // });

//         // Remove invalid tokens from your database
//         if (invalidTokens.length) {
//           // console.log("Invalid tokens found:", invalidTokens);
//           await removeInvalidTokensFromDatabase(invalidTokens);
//         }
//       })
//       .catch((error) => {
//         console.log("Error sending notification:", error);
//       });
//   }
// };

import { messaging } from "firebase-admin";

export const sendNotification = async (notification: {
  tokens: string | string[];
  data: { [key: string]: string };
}) => {
  const tokens = Array.isArray(notification.tokens)
    ? removeEmptyToken(notification.tokens, ["", null, undefined])
    : [notification.tokens];
  console.log("sendNotification -> tokens", tokens);

  if (tokens.length === 0) {
    console.log("No tokens provided for notification");
    return;
  }

  try {
    const messages = tokens.map((token) => ({
      token: token,
      data: notification.data,
    }));

    // Send notifications in batches of 500 (FCM limit)
    const batchSize = 500;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const response = await messaging().sendMulticast({
        tokens: batch.map((m) => m.token),
        data: notification.data,
      });

      console.log(
        `Batch ${Math.floor(i / batchSize) + 1} Notification Sent. Success: ${
          response.successCount
        }, Failure: ${response.failureCount}`,
        new Date(),
        notification.data.type
      );

      // Handle invalid tokens
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log("Failed to send notification to", batch[idx].token);
          console.log("Error:", resp.error);
          const errorCode = resp.error ? resp.error.code : null;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/unregistered"
          ) {
            failedTokens.push(batch[idx].token);
          }
        }
      });

      // Remove invalid tokens from your database
      if (failedTokens.length > 0) {
        console.log("Invalid tokens found:", failedTokens);
        await removeInvalidTokensFromDatabase(failedTokens);
      }
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const removeEmptyToken = (arr: string[], value: any[]): string[] => {
  if (!arr.length) return [];
  return arr.filter((item) => !value.includes(item));
};

const removeInvalidTokensFromDatabase = async (invalidTokens: string[]) => {
  // Implement this function to remove invalid tokens from your database
  console.log("Removing invalid tokens from database:", invalidTokens);
  // Example: Call your database service to remove invalid tokens
};
// export const removeEmptyToken = (arr, value) => {
//   var i = 0;
//   if (!arr.length) return [];
//   while (i < arr.length) {
//     if (value.includes(arr[i])) {
//       arr.splice(i, 1);
//     } else {
//       ++i;
//     }
//   }
//   return arr;
// };

// const removeInvalidTokensFromDatabase = async (invalidTokens) => {
//   // Implement this function to remove invalid tokens from your database
//   // console.log("Removing invalid tokens from database:", invalidTokens);
//   // Example: Call your database service to remove invalid tokens
// };
