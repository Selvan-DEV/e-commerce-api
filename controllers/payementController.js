const stripe = require('../config/stripeConfig');
const axios = require('axios');
const Payment = require('../models/paymentModel');

exports.createPaymentMethod = async (req, res) => {
  try {
    const { id, email, userId } = req.body;
    const userCardCustomerMappingData = await Payment.getCustomerIdByUserId(userId);
    let result = null;

    /** If user ID is not there in the usercarddetails table then create customer account in the stripe 
     * and add customer and user in the usercarddetails 
     * */
    if (userCardCustomerMappingData.length > 0) {
      const attachNewCardToCustomer = await stripe.paymentMethods.attach(id, {
        customer: userCardCustomerMappingData[0].paymentCustomerId,
      });
      const payload = { userId: userId, paymentMethodId: id, customerId: userCardCustomerMappingData[0].paymentCustomerId }
      result = await Payment.addPaymentMethodId(payload);
    } else {
      /** Create customer in stripe for user */
      const customer = await stripe.customers.create({
        payment_method: id,
        email: email,
      });

      /** Save Customer ID and User ID in the usercarddetails table */
      const payload = { userId: userId, paymentMethodId: id, customerId: customer.id }
      result = await Payment.addPaymentMethodId(payload);
    }

    res.json({ message: 'Payment method created successfully', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCardsListByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const usersCardsMappingData = await Payment.getCustomerIdByUserId(userId);
    if (!usersCardsMappingData.length) {
      res.status(404).json({ error: "No cards associated with the user" })
    }

    const customerId = usersCardsMappingData[0].paymentCustomerId;
    const paymentMethods = await stripe.paymentMethods.list({ customer: customerId });
    const response = paymentMethods.data.map(x => ({
      brand: x.card.brand.toUpperCase(),
      expMonth: x.card.exp_month,
      expYear: x.card.exp_year,
      cardNumber: x.card.last4,
      paymentMethodId: x.id,
      customerId: x.customer
    }));
    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.deletePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    if (!paymentMethodId) {
      res.status(404).json({ message: 'Payment Method ID is required' });
      return;
    }

    const response = await stripe.paymentMethods.detach(paymentMethodId);
    if (response) {
      res.status(200).json({ message: "Card has been deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.createPaymentIntent = async (req, res) => {
  const { customerId, paymentMethodId, shippingAddress, deliveryAddress, amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd', // Replace with your desired currency
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: false, // Manually confirm later
      shipping: {
        address: shippingAddress.address, // Replace with actual shipping address object
        name: 'Customer Name', // Replace with customer name
        phone: '+1234567890', // Replace with customer phone number
      },
      receipt_email: 'customer@example.com', // Replace with customer email
      // metadata: {
      //   delivery_address: deliveryAddress.address, // Store delivery address for reference
      // },
    });

    if (paymentIntent.client_secret) {
      // Return client_secret to client-side
      res.json({ clientSecret: paymentIntent.client_secret });
    } else {
      console.error('Error creating PaymentIntent: No client secret found');
      res.status(500).json({ error: 'Payment processing error' });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};