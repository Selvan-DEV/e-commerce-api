import fs from "fs";
import path from "path";
import os from "os";
import PDFDocument from "pdfkit";

export const generateInvoicePDF = async (orderData) => {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `invoice-${orderData.id}.pdf`);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);
    doc.fontSize(20).text("MyShop Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Order ID: ${orderData.id}`);
    doc.text(`Customer: ${orderData.customerName}`);
    doc.text(`Amount Paid: ₹${orderData.amount}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", (err) => reject(err));
  });
};
