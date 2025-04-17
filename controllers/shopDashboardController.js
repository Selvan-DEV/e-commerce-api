const ShopDashboardModel = require('../models/shopDashboardModel');
const Shop = require('../models/shopModel');

exports.getRecentOrders = async (req, res) => {
  const { shopId } = req.params;
  if (!shopId) {
    res.status(401).json({ message: "Unautharaized access" });
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

exports.getMonthlyRevenue = async (req, res) => {
  const { shopId } = req.params;
  if (!shopId) {
    res.status(401).json({ message: "Unautharaized access" })
  }

  try {
    const revenueData = await ShopDashboardModel.fetchMonthlyRevenue(shopId);
    if (revenueData && revenueData.length) {
      const monthlyRevenueValues = revenueData.map((row, index) => ({
        id: index + 1,
        month: row.month,
        revenue: Number(row.totalRevenue),
      }));
      return res.status(200).json(monthlyRevenueValues);
    } else {
      return res.status(204).json({ message: "No content" });
    }
  } catch (error) {
    console.error("Monthly Revenue API Error:", error);
    res.status(500).json({ message: "Failed to fetch monthly revenue" });
  }
};

exports.getDailyRevenue = async (req, res) => {
  const { shopId } = req.params;

  if (!shopId) {
    return res.status(400).json({ message: "Missing shopId query param" });
  }

  try {
    const revenueData = await ShopDashboardModel.getDailyRevenueData(Number(shopId));
    if (revenueData && revenueData.length) {
      const dailyRevenueValues = revenueData.map((row, index) => ({
        id: index + 1,
        date: row.date,
        revenue: Number(row.totalRevenue),
      }));
      return res.status(200).json(dailyRevenueValues);
    } else {
      return res.status(204).json({ message: "No content" });
    }
  } catch (error) {
    console.error("Failed to fetch daily revenue:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};