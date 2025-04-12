import nodemailer from "nodemailer";

export const sendEmailWithAttachment = async ({ to, subject, text, attachments }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "selvan894050@gmail.com",
        pass: "btur xukw ouag bejy",
      },
    });

    const mailOptions = {
      from: `"MyShop" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
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
