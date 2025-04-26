import { Constants } from '../constants/constants.js';

export const getStatusUpdateTemplate = (orderData) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #FFFF; border: 1px solid #eee; padding: 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://nagercoil-chips-shop-ui.vercel.app/_next/image?url=%2Fimages%2Flogo%2Flogo.png&w=128&q=75" alt="Logo" style="width: 120px;background-color: #000000;border-radius: 20px;" />
        <h2 style="color: #333;">${orderData.orderStatusInfo}</h2>
        <p style="margin: 0; color: #666;">Thank you for shopping with ${Constants.STORE_NAME}!</p>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px;">
        <p style="font-size: 16px; margin-bottom: 5px;"><strong>Hi ${orderData.customerName},</strong></p>
        <p style="margin: 0 0 15px;">${orderData.statusChangeMessage}.</p>
        
        <p style="margin: 0;">If you have any questions, feel free to contact us.</p>
      </div>

      <hr style="margin: 40px 0;" />

      <footer style="text-align: center; color: #999; font-size: 12px;">
        &copy; ${new Date().getFullYear()} ${Constants.STORE_NAME}. All rights reserved.
      </footer>
    </div>
  `;
};
