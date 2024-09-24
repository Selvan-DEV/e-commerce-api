const Shop = require('../models/shopModel');

exports.getDashboardSummaryCards = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ message: "Shop Id Is Required" });
    }

    const orders = await Shop.getOrdersByShopId(shopId);
    const ordersWithStatus = await Promise.all(orders.map(async (item) => {
      const orderStatus = await Shop.getOrderStatusById(item.orderStatus);
      return {
        ...item,
        orderStatus: orderStatus.orderStatusName
      };
    }));

    if (ordersWithStatus.length > 0) {
      const deliveredOrders = ordersWithStatus.filter(x => x.orderStatus === 'Delivered');
      const readyForDispatch = ordersWithStatus.filter(x => x.orderStatus === 'Ready for Dispatch');
      const newOrders = ordersWithStatus.filter(x => x.orderStatus === 'Order Received');

      const result = [
        { key: 'Total Orders', value: ordersWithStatus.length, icon: '🛒', route: '/shop-management/orders' },
        { key: 'Total New Orders', value: newOrders.length, icon: '🛒', route: '/shop-management/orders?status=1' },
        { key: 'Total Ready For Dispatch', value: readyForDispatch.length, icon: "🍳", route: '/shop-management/orders?status=4' },
        { key: 'Total Delivered', value: deliveredOrders.length, icon: "🥡", route: '/shop-management/orders?status=7' }
      ];

      return res.status(200).json(result);
    } else {
      return res.status(404).json({ message: 'No Orders Found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { query } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop Id is required' });
    }

    const filters = {
      searchQuery: query || null,
    };

    const customers = await Shop.getCustomers(shopId, filters);

    if (!customers.length) {
      res.status(204).json({ message: "No Customrs Found" });
      return
    }

    const result = customers.map((x) => ({ firstName: x.firstName, lastName: x.lastName, email: x.email, phoneNumber: x.phoneNumber }))

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getProductsbyShopId = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ message: "Shop Id Is Requried" });
    }

    const products = await Shop.getProductsByShopId(shopId);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductByShopIdAndProductId = async (req, res) => {
  try {
    const { shopId, productId } = req.params;

    if (!shopId) {
      return res.status(400).json({ message: "Id Is Requried" });
    }

    const product = await Shop.getProductByShopIdAndProductId(shopId, productId);
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const product = req.body;
    const productId = await Shop.create(product);
    res.status(201).json(productId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = req.body;
    const productId = await Shop.updateProduct(product);
    res.status(201).json(productId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoriesByShopId = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ message: "Shop Id Is Requried" });
    }

    const productCategories = await Shop.getCategoriesByShopId(shopId);
    res.status(200).json(productCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrdersByShopId = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status } = req.query;

    const filters = {
      status: status || '',
    };

    if (!shopId) {
      return res.status(400).json({ message: 'Shop Id is required' });
    }

    const orders = await Shop.getOrdersByShopId(shopId, filters);

    if (!orders.length) {
      res.status(204).json({ message: "No Order Found" });
      return
    }

    // Get Respective addressDetails
    const ordersWithAddressDetails = await Promise.all(orders.map(async (item) => {
      const addressDetails = await Shop.getAddressDetailsById(item.deliveryAddressId);
      const orderStatus = await Shop.getOrderStatusById(item.orderStatus);
      return {
        ...item,
        deliveryAddress: addressDetails,
        orderStatus: orderStatus.orderStatusName
      };
    }));

    res.status(200).json(ordersWithAddressDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getOrderStatuses = async (req, res) => {
  try {
    const orderStatuses = await Shop.getOrderStatuses();
    res.status(200).json(orderStatuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderItemsByOrderId = async (req, res) => {
  try {
    const { shopId, orderId } = req.params;

    if (!orderId || !shopId) {
      return res.status(400).json({ message: 'Id is required' });
    }

    const orders = await Shop.getOrderItemsByOrderId(orderId);
    const order = await Shop.getOrderByOrderId(orderId);
    const orderStatus = await Shop.getOrderStatusById(order.orderStatus)

    if (orders.length <= 0) {
      return res.status(404).json({ message: "No Order Items Found" });
    }

    // Get Respective addressDetails
    const orderItems = await Promise.all(orders.map(async (item) => {
      const product = await Shop.getProductById(item.productId);
      return {
        ...item,
        product
      };
    }));

    // Calculate total price
    const totalPrice = orderItems.reduce((sum, item) => {
      return sum + parseFloat(item.price);
    }, 0);

    const response = {
      orderId: orderItems[0].orderId,
      totalAmount: totalPrice,
      orderStatus: orderStatus.orderStatusName,
      orderItems
    }

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.updateOrderStatus = async (req, res) => {
  const { orderId, orderStatusId } = req.body;

  if (!orderId || !orderStatusId) {
    return res.status(400).json({ message: 'ID is Requried' });
  }

  try {
    const isStatusUpdated = await Shop.updateOrderStatus(orderStatusId, orderId);
    res.status(200).json(isStatusUpdated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// exports.getCategoriesAndProducts = async (_req, res) => {
//   try {
//     const products = await Product.getAllProducts();
//     const categoryMap = new Map();

//     for (const item of products) {
//       // Fetch category details for each product
//       const category = await Product.getCategoryById(item.categoryId);

//       if (!categoryMap.has(category.categoryId)) {
//         categoryMap.set(category.categoryId, {
//           categoryName: category.categoryName,
//           categoryId: category.categoryId,
//           products: []
//         });
//       }

//       // Add the product to the appropriate category
//       categoryMap.get(category.categoryId).products.push(item.productName);
//     }

//     // Convert the map back to an array
//     const categoriesAndProducts = Array.from(categoryMap.values());

//     res.status(200).json(categoriesAndProducts);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.getProductDetail = async (req, res) => {
//   try {
//     const product = await Product.getByProductName(req.params.productName);
//     if (product) {
//       res.status(200).json(product);
//     } else {
//       res.status(404).json({ message: 'Product not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.addProduct = async (req, res) => {
//   try {
//     const product = req.body;
//     const productId = await Product.addProductToCart(product);
//     res.status(201).json({ id: productId });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.deleteProduct = async (req, res) => {
//   try {
//     const affectedRows = await Product.deleteById(req.params.id);
//     if (affectedRows > 0) {
//       res.status(200).json({ message: 'Product deleted successfully' });
//     } else {
//       res.status(404).json({ message: 'Product not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
