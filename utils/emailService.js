import nodemailer from "nodemailer";
import { Constants } from '../constants/constants.js';

export const sendEmailWithAttachment = async ({ to, subject, text, attachments, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "selvan894050@gmail.com",
        pass: "btur xukw ouag bejy",
      },
    });

    const mailOptions = {
      from: `${Constants.STORE_NAME} <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments, // Example: [{ filename: "invoice.pdf", path: "./invoices/invoice.pdf" }]
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};
