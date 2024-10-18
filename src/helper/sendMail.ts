import nodemailer from "nodemailer";

export const sendMail = (to: string, subject: String, html: String) => {
  const mailOptions = {
    from: process.env.FROM,
    to: to,
    subject: subject,
    // text: detail,
    html: html,
  };
  //   console.log(mailOptions, "mailOptions");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.FROM,
      pass: process.env.PASSWORD,
    },
  });
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("error occur in sending mail", error);
        return;
      } else {
        resolve(info);
        console.log("Email sent: " + info.response);
        return;
      }
    });
  });
};
