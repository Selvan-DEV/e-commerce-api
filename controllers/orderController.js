const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Shop = require('../models/shopModel');
const { sendEmailWithAttachment } = require('../utils/emailService');
const { generateOrdersCSV } = require('../utils/csvGenerator');
const { getOrderConfirmationTemplate } = require('../templates/orderConfirmationEmail');
const { chromium } = require('playwright');
const handlebars = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const { toWords } = require("number-to-words");

const { v4: uuidv4 } = require('uuid');
const { Constants } = require('../constants/constants');

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

      let unitPrice = Number(product.price) - Number(product.offerPrice);

      // Check if a valid variantId is provided
      if (item.variantId && item.variantId > 0) {
        const variant = await Product.getVariantById(item.variantId);
        if (variant && variant.additionalPrice) {
          unitPrice = variant.additionalPrice - Number(product.offerPrice);
          item.variant = variant.variantName;
        }
      }

      const totalPrice = (item.quantity * Number(unitPrice)).toFixed(2);

      return {
        ...item,
        price: totalPrice,
        product,
      };
    }));

    // Calculate summary using the already computed item.price
    const summary = cartItemsWithDetails.reduce((acc, item) => {
      acc.totalQuantity += item.quantity;
      acc.totalPrice += Number(item.price); // Use the correct calculated price
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
  let orderId = 0;

  try {
    // Step 1: Save order and items
    const createOrderResponse = await Order.createOrder(responseBody);
    orderId = createOrderResponse.insertId;

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

    req.io.emit("orderUpdate", { orderId });

    // Step 3: Respond immediately to client
    res.status(201).json({ ...createOrderResponse, message: "Order created successfully." });

    // Step 4: Continue PDF + Email in background
    generateInvoiceAndSendEmail(orderId, responseBody);

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
};


const generateInvoiceAndSendEmail = async (orderId, responseBody) => {
  let invoicePath = null;
  try {
    const invoiceDate = new Date().toLocaleDateString("en-IN");

    const user = await User.getUserById(responseBody.userId);
    const templatePath = path.join(__dirname, "../templates/orderInvoiceTemplate.html");
    const source = await fs.readFile(templatePath, "utf-8");
    const template = handlebars.compile(source);

    const addressRows = await User.getUserAddressesByIds(responseBody.shippingAddressId, responseBody.billingAddressId);
    let shippingAddress = null;
    let billingAddress = null;
    if (addressRows && addressRows.length) {
      shippingAddress = addressRows.find((addr) => addr.addressId === responseBody.shippingAddressId);
      billingAddress = addressRows.find((addr) => addr.addressId === responseBody.billingAddressId);
    }

    const html = template({
      orderId,
      customer: user?.firstName,
      shippingAddress,
      billingAddress,
      items: responseBody.cartItem.cartItems.map((item, index) =>
      ({
        ...item, serial: index + 1,
        salePrice: item.product.price - Number(item.product.offerPrice)
      })),
      totalAmount: responseBody.orderAmount,
      sellerName: Constants.STORE_NAME,
      invoiceDate,
      amountInWords: toWords(responseBody.orderAmount) + " only",
    });

    // Check if the invoices folder exists
    const invoicesDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
      console.log('✅ Created invoices folder');
    } else {
      console.log('✅ invoices folder already exists');
    }

    invoicePath = path.join(__dirname, '../invoices', `invoice-${orderId}.pdf`);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({ path: invoicePath, format: "A4" });
    await browser.close();

    const emailData = {
      invoiceId: `Invoice-${orderId}`,
      date: invoiceDate,
      customerName: responseBody.name || "Customer",
      customerEmail: responseBody.toEmailAddress,
      items: responseBody.cartItem.cartItems,
      total: responseBody.orderAmount,
    };

    const customerEmailOptions = {
      to: emailData.customerEmail,
      subject: "Your Order Confirmation - MyShop",
      html: getOrderConfirmationTemplate(emailData),
      attachments: [{ filename: "invoice.pdf", path: invoicePath }],
    };

    const adminEmailOptions = {
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Received - ${emailData.invoiceId}`,
      text: `A new order has been placed by ${emailData.customerEmail}.`,
      attachments: [{ filename: "invoice.pdf", path: invoicePath }],
    };

    await Promise.all([
      sendEmailWithAttachment(customerEmailOptions),
      sendEmailWithAttachment(adminEmailOptions),
    ]);

    // Save Invoice Meta Data
    const payload = {
      orderId,
      userId: responseBody.userId
    }
    await Order.insertInvoiceMetaData(payload);

  } catch (error) {
    console.error("Error in background invoice/email process:", error);
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

exports.createCheckoutSession = async (req, res) => {
  const formData = req.body;

  try {
    let userId = formData.userId;
    let shippingAddressId = formData.shippingAddressId;
    let billingAddressId = formData.billingAddressId;
    let discountValue = 0;
    const totalPrice = formData.totalPrice;
    const deliveryCharge = formData.deliveryCharge;
    const sessionId = formData.sessionId;

    // STEP 1: Create guest user if userId is 0
    if (userId === 0) {
      const existingGuestUser = await User.findUserByEmailAndRole(formData.email);
      if (existingGuestUser && existingGuestUser.userId) {
        userId = existingGuestUser.userId;
      } else {
        const { firstName, lastName, phone } = formData.shippingAddress;
        const userInsertId = await User.createUser({
          firstName,
          lastName,
          email: formData.email,
          phone,
          isPrimaryUser: false,
          isActive: true,
          password: "",
          role: "Guest"
        });

        userId = userInsertId;
      }

      await Order.updateCartUserId(userId, sessionId);
    }

    // STEP 2: Save addresses
    if (shippingAddressId === 0) {
      const { firstName, lastName, phone, pincode, address, city, state, apartment } = formData.shippingAddress;
      const shippingAddressResultId = await User.addUserAddress(userId, {
        firstName,
        lastName,
        phoneNumber: phone,
        pincode,
        locality: formData.locality,
        address,
        city,
        state,
        landmark: apartment,
        alternatePhoneNumber: phone,
        addressType: "Shipping"
      });

      shippingAddressId = shippingAddressResultId;
    }

    if (!formData.billingSameAsShipping && billingAddressId === 0) {
      const { firstName, lastName, phone, pincode, address, city, state, apartment } = formData.billingAddress;
      const billingAddressResultId = await User.addUserAddress(userId, {
        firstName,
        lastName,
        phoneNumber: phone,
        pincode,
        locality: formData.locality,
        address,
        city,
        state,
        landmark: apartment,
        alternatePhoneNumber: phone,
        addressType: "Billing"
      });

      billingAddressId = billingAddressResultId;
    } else if (formData.billingSameAsShipping) {
      billingAddressId = formData.shippingAddressId;
    }

    // STEP 3: Validate coupon
    if (formData.discountCode) {
      const couponInfo = await User.getCoupon(formData.discountCode);
      if (couponInfo && couponInfo.usageLimit !== null && couponInfo.usedCount >= couponInfo.usageLimit) {
        discountValue = 0;
      } else if (couponInfo) {
        discountValue = parseFloat(couponInfo.value);
      }
    }

    const finalAmount = Math.max(0, totalPrice + deliveryCharge - discountValue);

    // STEP 4: Store in checkout_sessions table
    const checkoutSessionResultId = await Order.insertCheckoutSession({
      userId,
      shippingAddressId,
      billingAddressId,
      discountCode: formData.discountCode,
      discountValue,
      deliveryCharge,
      totalPrice,
      finalAmount
    });

    if (checkoutSessionResultId) {
      res.status(200).json({
        message: 'Checkout session created',
        checkoutSessionId: checkoutSessionResultId,
        finalAmount
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.getCheckoutSessionById = async (req, res) => {
  const { checkoutSessionId } = req.params;

  if (!checkoutSessionId || isNaN(Number(checkoutSessionId))) {
    return res.status(400).json({ error: 'Invalid checkout session ID' });
  }
  try {
    const sessionRow = await Order.getCheckoutSessionData(checkoutSessionId);
    if (!sessionRow) {
      return res.status(404).json({ error: 'Checkout session not found' });
    }
    const { shippingAddressId, billingAddressId } = sessionRow;
    const addressRows = await User.getUserAddressesByIds(shippingAddressId, billingAddressId);
    const user = await User.getUserById(sessionRow.userId);

    if (addressRows && addressRows.length) {
      const shippingAddress = addressRows.find((addr) => addr.addressId === shippingAddressId);
      const billingAddress = addressRows.find((addr) => addr.addressId === billingAddressId);

      // 3. Combine and return
      return res.json({
        ...sessionRow,
        email: user ? user.email : null,
        shippingAddress: shippingAddress || null,
        billingAddress: billingAddress || null
      });
    } else {
      return res.status(400).json({ message: "No address found" });
    }
  } catch (error) {
    console.error('Error fetching checkout session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


exports.exportOrdersCsv = async (req, res) => {
  console.log(res, 'res')
  try {
    // const orders = await getOrdersWithStatus("Order Received");
    const ordersMock = [
      {
        orderNumber: "ORD123456",
        transportMode: "Air",
        paymentMode: "Prepaid",
        codAmount: 0,
        customerName: "Manikanda",
        phone: "9876543210",
        email: "mani@example.com",
        shippingAddress: {
          address: "12B, Indira Nagar",
          apartment: "Near Metro",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560038"
        },
        billingAddress: {
          address: "45A, MG Road",
          apartment: "Suite 5",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001"
        },
        products: [
          {
            skuCode: "SKU001",
            skuName: "Protein Bar",
            quantity: 3,
            price: 150
          },
          {
            skuCode: "SKU002",
            skuName: "Whey Protein",
            quantity: 1,
            price: 1200
          }
        ],
        sellerInfo: {
          name: "FitMart",
          gst: "29ABCDE1234F2Z5",
          addressLine1: "88, Health Street",
          addressLine2: "Warehouse Zone",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560010"
        }
      }
    ];
    const csvData = await generateOrdersCSV(ordersMock);
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(csvData);
  } catch (error) {
    console.error("CSV Export Failed:", error);
    res.status(500).json({ message: "Failed to export orders" });
  }
}