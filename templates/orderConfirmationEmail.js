import { Constants } from '../constants/constants.js';

export const getOrderConfirmationTemplate = (orderData) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #FFFF; border: 1px solid #eee; padding: 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://nagercoil-chips-shop-ui.vercel.app/_next/image?url=%2Fimages%2Flogo%2Flogo.png&w=128&q=75" alt="Logo" style="width: 120px;background-color: #065405;border-radius: 20px;" />
        <h2 style="color: #333;">Order Confirmation</h2>
        <p style="margin: 0; color: #666;">Thank you for shopping with ${Constants.STORE_NAME}!</p>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px;">
        <p style="font-size: 16px; margin-bottom: 5px;"><strong>Hi ${orderData.customerName},</strong></p>
        <p style="margin: 0 0 15px;">Your order <strong>#${orderData.invoiceId}</strong> has been confirmed. Here's a summary of your purchase:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="text-align: left;">
              <th style="padding: 10px; border-bottom: 1px solid #ddd;">Product</th>
              <th style="padding: 10px; border-bottom: 1px solid #ddd;">Qty</th>
              <th style="padding: 10px; border-bottom: 1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.items.map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product.productName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">Rs.${Number(item.product.price) - Number(item.product.offerPrice)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <p style="font-size: 16px;"><strong>Total: Rs.${orderData.total}</strong></p>
        </div>
        
        <p style="margin-top: 30px;">We’ll send you another update when your order is on the way.</p>
        <p style="margin: 0;">If you have any questions, feel free to contact us.</p>
      </div>

      <hr style="margin: 40px 0;" />

      <footer style="text-align: center; color: #999; font-size: 12px;">
        &copy; ${new Date().getFullYear()} ${Constants.STORE_NAME}. All rights reserved.
      </footer>
    </div>
  `;
};
