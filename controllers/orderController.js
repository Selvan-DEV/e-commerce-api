const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Shop = require('../models/shopModel');
const fs = require("fs");
const { sendEmailWithAttachment } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');

const { v4: uuidv4 } = require('uuid');

exports.addProductToCart = async (req, res) => {
  try {
    const { productId, sessionId, quantity, userId } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    if (!sessionId && !userId) {
      let cartItem = req.body;
      cartItem.sessionId = uuidv4();
      // Insert new cart item without session ID
      const cartItemId = await Order.addProductToCart(cartItem);
      return res.status(201).json(cartItemId);
    } else {
      // Insert a new cart item for this session ID
      let cartItem = req.body;
      const cartItemId = await Order.addProductToCart(cartItem);
      return res.status(201).json(cartItemId);
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCartItemsBySessionId = async (req, res) => {
  try {
    const { cartItemId } = req.params;

    if (!cartItemId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Fetch cart items for the given session ID or UserId
    const cartItems = await Order.getAllCartItemsBySessionId(cartItemId);

    if (!cartItems.length) {
      return res.status(204).json({ message: 'No cart items found for the given Cart Item ID' });
    }

    // Fetch product details for each cart item and calculate the total price
    const cartItemsWithDetails = await Promise.all(cartItems.map(async (item) => {
      const product = await Product.getByProductId(item.productId);
      item.price = (item.quantity * product.price).toFixed(2); // Calculate product price based on the quantity
      return {
        ...item,
        product
      };
    }));

    // Calculate summary
    const summary = cartItemsWithDetails.reduce((acc, item) => {
      acc.totalQuantity += item.quantity;
      acc.totalPrice += item.quantity * item.product.price;
      return acc;
    }, { totalQuantity: 0, totalPrice: 0 });

    summary.totalPrice = summary.totalPrice.toFixed(2);

    res.status(200).json({ cartItems: cartItemsWithDetails, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity, cartItemId } = req.body;
    const response = await Order.updateCartItem(quantity, cartItemId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    if (!cartItemId) {
      return res.status(400).json({ message: 'Cart Item ID is required' });
    }

    const response = await Order.deleteCartItem(cartItemId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.createOrder = async (req, res) => {
  const responseBody = req.body;
  const io = req.io;

  let pdfPath = null;

  try {
    // Step 1: Create order
    const createOrderResponse = await Order.createOrder(responseBody);
    const orderId = createOrderResponse.insertId;

    if (orderId > 0 && responseBody.cartItem) {
      const orderItems = responseBody.cartItem.cartItems.map((item) => ({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      await Promise.all(orderItems.map((item) => Order.addOrderItems(item)));
      await Order.deleteCartItemsByUserId(responseBody.userId);
    }

    // Step 2: Broadcast order
    io.emit("orderUpdate", { id: createOrderResponse.affectedRows });

    // Step 3: Prepare invoice data
    const invoiceData = {
      invoiceId: `Invoice-${orderId}`,
      date: new Date().toLocaleDateString(),
      customerName: responseBody.name || "Customer",
      customerEmail: responseBody.toEmailAddress,
      items: responseBody.cartItem.cartItems,
      total: responseBody.orderAmount,
    };

    pdfPath = await generateInvoicePDF(invoiceData);

    // Step 4: Email content
    const customerEmailOptions = {
      to: invoiceData.customerEmail,
      subject: "Your Order Confirmation - MyShop",
      text: "Thank you for your purchase! Please find your invoice attached.",
      attachments: [
        {
          filename: "invoice.pdf",
          path: pdfPath,
        },
      ],
    };

    const adminEmailOptions = {
      to: "selvan894050@gmail.com",
      subject: `New Order Received - ${invoiceData.invoiceId}`,
      text: `A new order has been placed by ${invoiceData.customerEmail}.`,
      attachments: [
        {
          filename: "invoice.pdf",
          path: pdfPath,
        },
      ],
    };

    // Step 5: Send both emails
    await Promise.all([
      sendEmailWithAttachment(customerEmailOptions),
      sendEmailWithAttachment(adminEmailOptions),
    ]);

    // Step 6: Clean up invoice file
    fs.unlink(pdfPath, (err) => {
      if (err) console.error("Failed to delete invoice:", err);
    });

    return res.status(201).json(createOrderResponse);
  } catch (error) {
    // Delete the PDF if it was generated
    if (pdfPath && fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    return res.status(500).json({ error: "Order creation failed. Please try again." });
  }
};

exports.getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.getOrdersByUserId(userId);

    if (!orders.length) {
      res.status(404).json({ message: "No Order Found" });
      return
    }

    // Get Respective addressDetails
    const ordersWithStatus = await Promise.all(orders.map(async (item) => {
      const orderStatus = await Shop.getOrderStatusById(Number(item.orderStatus));
      return {
        ...item,
        orderStatus: orderStatus?.orderStatusName || null
      };
    }));

    res.status(200).json(ordersWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getOrderByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const response = await Order.getOrderByOrderId(orderId);

    if (!response.length) {
      res.status(404).json({ message: "No Order Found" });
      return
    }

    const cartItemsWithDetails = await Promise.all(response.map(async (item) => {
      const product = await Product.getByProductId(item.productId);
      return {
        ...item,
        product
      };
    }));

    res.status(200).json(cartItemsWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
