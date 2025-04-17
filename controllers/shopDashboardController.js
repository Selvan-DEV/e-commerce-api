const ShopDashboardModel = require('../models/shopDashboardModel');
const Shop = require('../models/shopModel');

exports.getRecentOrders = async (req, res) => {
  const { shopId } = req.params;
  if (!shopId) {
    res.status(401).json({ message: "Unautharaized access" })
  }

  try {
    const orders = await ShopDashboardModel.getRecentOrders(shopId);
    if (!orders.length) {
      return res.status(204).json({ message: "No Order Found" });
    }

    const ordersWithProucts = await Promise.all(orders.map(async (order) => {
      const orderStatus = await Shop.getOrderStatusById(Number(order.orderStatus));
      const billingAddress = await ShopDashboardModel.getAddressById(order.billingAddressId);
      const deliveryAddress = await ShopDashboardModel.getAddressById(order.shippingAddressId);
      const orderItems = await ShopDashboardModel.getOrderByOrderId(order.orderId);

      const products = await Promise.all(orderItems.map(async (orderItem) => {
        const product = await ShopDashboardModel.getByProductId(orderItem.productId);
        return {
          productId: product.id,
          productName: product.productName,
          orderQuantity: orderItem.quantity
        };
      }));

      return {
        ...order,
        orderStatus: orderStatus.orderStatusName,
        billingAddress: billingAddress || null,
        deliveryAddress: deliveryAddress || null,
        products
      };
    }));

    if (ordersWithProucts) {
      res.status(200).json(ordersWithProucts);
    } else {
      res.status(404).json({ message: 'There is no recent Orders' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};