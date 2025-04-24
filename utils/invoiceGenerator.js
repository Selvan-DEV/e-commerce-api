import fs from "fs";
import path from "path";
import os from "os";
import PDFDocument from "pdfkit";

// Utility to download image
const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

/**
 * Generate invoice PDF with logo, product table, and order details
 */
export const generateInvoicePDF = async (orderData) => {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `invoice-${orderData.id || "temp"}.pdf`);
  // const logoUrl = "https://nagercoil-chips-shop-ui.vercel.app/_next/image?url=%2Fimages%2Flogo%2Flogo.png&w=128&q=75";
  const logoPath = path.join(tempDir, "invoice-logo.png");

  // await downloadImage(logoUrl, logoPath);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // --- LOGO WITH BLACK BACKGROUND ---
    // doc.rect(40, 40, 100, 60).fill("#000"); // black rectangle
    // doc.image(logoPath, 45, 45, { width: 50 }); // place logo inside

    // --- TITLE ---
    doc.fillColor("black")
      .fontSize(18)
      .text("Tax Invoice/Bill of Supply/Cash Memo", 200, 40, { align: "right" })
      .fontSize(10)
      .text("(Triplicate for Supplier)", { align: "right" });

    // --- SELLER DETAILS ---
    doc.fillColor("black")
      .fontSize(10)
      .text("Sold By :", 40, 120)
      .font("Helvetica-Bold")
      .text("CHARISSMA AESTHETIC STUDIO")
      .font("Helvetica")
      .text("25,Dr.Nair Road,T Nagar, Opp to Agada Hospital,")
      .text("CHENNAI, TAMIL NADU, 600017")
      .text("IN")
      .text("PAN No: AMYPA2631B")
      .text("GST Registration No: 33AMYPA2631BZG");

    // --- CUSTOMER DETAILS ---
    const customerName = orderData.customerName || "Customer";

    doc.font("Helvetica-Bold").text("Billing Address :", 330, 120)
      .font("Helvetica")
      .text(customerName, 330)
      .text("Apartment No - 12, 8th Street Sri Devi nagar", 330)
      .text("Alapakkam porur", 330)
      .text("CHENNAI, TAMIL NADU, 600116", 330)
      .text("State/UT Code: 33", 330);

    doc.font("Helvetica-Bold").text("Shipping Address :", 330)
      .font("Helvetica")
      .text(customerName, 330)
      .text("Apartment No - 12, 8th Street Sri Devi nagar", 330)
      .text("Alapakkam porur", 330)
      .text("CHENNAI, TAMIL NADU, 600116", 330)
      .text("State/UT Code: 33", 330)
      .text("Place of supply: TAMIL NADU", 330)
      .text("Place of delivery: TAMIL NADU", 330);

    // --- ORDER INFO ---
    const orderDate = new Date().toLocaleDateString();
    const invoiceNo = `IN-${orderData.id || "0001"}`;
    const invoiceDetails = `TN-${orderData.id || "0001"}-2526`;

    doc.moveDown();
    doc.text(`Order Number: ${orderData.id || "N/A"}`);
    doc.text(`Order Date: ${orderDate}`);
    doc.text(`Invoice Number: ${invoiceNo}`);
    doc.text(`Invoice Details: ${invoiceDetails}`);
    doc.text(`Invoice Date: ${orderDate}`);

    // --- ITEM TABLE ---
    doc.moveDown().font("Helvetica-Bold").text("Item Details", { underline: true }).moveDown();
    const item = {
      description: orderData.productName || "N/A",
      hsn: orderData.hsn || "N/A",
      qty: orderData.quantity || 1,
      unitPrice: orderData.price || 0,
    };

    const netAmount = item.unitPrice * item.qty;
    const cgst = netAmount * 0.09;
    const sgst = netAmount * 0.09;
    const total = netAmount + cgst + sgst;

    const headers = ["Description", "HSN", "Qty", "Unit Price", "Net", "CGST", "SGST", "Total"];
    const values = [
      item.description,
      item.hsn,
      item.qty.toString(),
      `₹${item.unitPrice.toFixed(2)}`,
      `₹${netAmount.toFixed(2)}`,
      `₹${cgst.toFixed(2)}`,
      `₹${sgst.toFixed(2)}`,
      `₹${total.toFixed(2)}`
    ];

    const startX = 40;
    const startY = doc.y + 10;
    const colWidths = [100, 60, 40, 70, 60, 60, 60, 60];
    const rowHeight = 20;

    // Draw headers
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc
        .rect(x, startY, colWidths[i], rowHeight)
        .stroke()
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(header, x + 5, startY + 5, { width: colWidths[i] - 10 });
    });

    // Draw values
    const dataY = startY + rowHeight;
    values.forEach((val, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc
        .rect(x, dataY, colWidths[i], rowHeight)
        .stroke()
        .font("Helvetica")
        .fontSize(9)
        .text(val, x + 5, dataY + 5, { width: colWidths[i] - 10 });
    });


    // --- FOOTER ---
    doc.moveDown().moveDown();
    doc.font("Helvetica-Bold").text(`Amount in Words: Five Hundred Fifty only`);
    doc.font("Helvetica").text(`Whether tax is payable under reverse charge - No`);

    doc.moveDown();
    doc.text("For CHARISSMA AESTHETIC STUDIO:", { align: "right" });
    doc.text("Authorized Signatory", { align: "right" });

    // Finalize PDF
    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", (err) => reject(err));
  });
};
