import { messaging } from "firebase-admin";

export const sendNotification = async (notification) => {
  const tokens = removeEmptyToken(notification.tokens, ["", null, undefined]);
  console.log("sendNotification -> tokens");

  if (tokens.length) {
    messaging()
      .sendMulticast(notification)
      .then(async (response) => {
        console.log(
          "Notification Send Successfully....",
          new Date(),
          notification.data.type
        );

        // Handle invalid tokens
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.log(resp.error);
            console.log("Failed to send notification to", tokens[idx]);
            const errorCode = resp.error ? resp.error.code : null;
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered"
            ) {
              invalidTokens.push(tokens[idx]);
            }
          } else {
            console.log(
              "Successfully sent notification toooooooooooooooooooooooooooooooooooo",
              tokens[idx]
            );
          }
        });

        // Remove invalid tokens from your database
        if (invalidTokens.length) {
          // console.log("Invalid tokens found:", invalidTokens);
          await removeInvalidTokensFromDatabase(invalidTokens);
        }
      })
      .catch((error) => {
        console.log("Error sending notification:", error);
      });
  }
};

export const removeEmptyToken = (arr, value) => {
  var i = 0;
  if (!arr.length) return [];
  while (i < arr.length) {
    if (value.includes(arr[i])) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
};

const removeInvalidTokensFromDatabase = async (invalidTokens) => {
  // Implement this function to remove invalid tokens from your database
  // console.log("Removing invalid tokens from database:", invalidTokens);
  // Example: Call your database service to remove invalid tokens
};
