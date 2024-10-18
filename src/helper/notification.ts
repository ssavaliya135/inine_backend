import { messaging } from "firebase-admin";

export const sendNotification = async (notification) => {
  const tokens = removeEmptyToken(notification.tokens, ["", null, undefined]);

  if (tokens.length) {
    const messages = tokens.map((token) => ({
      token,
      notification: notification.notification,
      data: notification.data,
    }));

    try {
      const sendPromises = messages.map((message) => messaging().send(message));
      const responses = await Promise.allSettled(sendPromises);

      responses.forEach((response, index) => {
        if (response.status === "fulfilled") {
          console.log(
            "Notification sent successfully toooooooooooooo:",
            tokens[index]
          );
        } else {
          console.error(
            "Error sending notification to:",
            tokens[index],
            response.reason
          );

          // Handle invalid tokens
          if (
            response.reason.code === "messaging/invalid-registration-token" ||
            response.reason.code ===
              "messaging/registration-token-not-registered"
          ) {
            removeInvalidTokenFromDatabase(tokens[index]);
          }
        }
      });

      const successCount = responses.filter(
        (r) => r.status === "fulfilled"
      ).length;
      console.log(`${successCount} messages were sent successfully`);
    } catch (error) {
      console.error("Error sending messages:", error);
    }
  }
};

export const removeEmptyToken = (arr, value) => {
  return arr.filter((token) => !value.includes(token));
};

const removeInvalidTokenFromDatabase = async (invalidToken) => {
  // Implement this function to remove invalid tokens from your database
  console.log("Removing invalid token from database:", invalidToken);
  // Example: Call your database service to remove invalid tokens
};
