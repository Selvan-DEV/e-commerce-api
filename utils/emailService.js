import nodemailer from "nodemailer";
import { Constants } from '../constants/constants.js';

export const sendEmailWithAttachment = async ({ to, subject, text, attachments, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nilafoods2025@gmail.com",
        pass: "lnub jrsx wzqo zqvc",
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

    return info;
  } catch (error) {
    throw error;
  }
};
