const Orders = require('../models/orderModel');
const Product = require('../models/productModel');
const Shop = require('../models/shopModel');
const User = require('../models/userModel');
const { generateOrdersCSV } = require('../utils/csvGenerator');
const { sendEmailWithAttachment } = require('../utils/emailService');
const { getStatusUpdateTemplate } = require('../templates/orderProcessingEmail.js');
const { Constants } = require('../constants/constants.js');

exports.getDashboardSummaryCards = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ message: "Shop Id Is Required" });
    }

    const orders = await Shop.getOrdersByShopId(shopId);
    if (!orders.length) {
      return res.status(204).json({ message: "No Order Found" });
    }

    const customers = await Shop.getCustomers(shopId);
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
        { key: 'Customers', value: customers.length, icon: 'people', route: '/shop-management/customers', change: "1.0%" },
        // { key: 'Total Orders', value: ordersWithStatus.length, icon: 'order', route: '/shop-management/orders', change: "1.0%" },
        { key: 'Total New Orders', value: newOrders.length, icon: 'order', route: '/shop-management/orders?status=1', change: "1.0%" },
        { key: 'Total Ready For Dispatch', value: readyForDispatch.length, icon: "order", route: '/shop-management/orders?status=4', change: "1.0%" },
        { key: 'Total Delivered', value: deliveredOrders.length, icon: "order", route: '/shop-management/orders?status=7', change: "1.0%" }
      ];

      return res.status(200).json(result);
    } else {
      return res.status(204).json({ message: 'No Orders Found' });
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
    const productWithCategory = await Promise.all(products.map(async (item) => {
      const category = await Shop.getCategoryById(item.categoryId);
      return {
        ...item,
        categoryName: category.categoryName
      };
    }));
    res.status(200).json(productWithCategory);
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
    const variants = await Shop.getProductPriceVariants(productId);

    const result = {
      ...product,
      variants: variants.length ? variants : []
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const product = req.body;

    // Insert into products table
    const productId = await Shop.create(product);
    // Insert into product_price_variants table if variants exist
    if (productId && product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        await Shop.createPriceVariant({
          productId: productId,
          variantName: variant.variantName,
          additionalPrice: variant.additionalPrice,
          stock: variant.stock
        });
      }
    }

    res.status(201).json({ id: productId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = req.body;

    // 1. Update main product info
    const productId = await Shop.updateProduct(product);

    // 2. Remove all existing variants for the product
    await Shop.deleteVariantsByProductId(product.id);

    // 3. Insert new variants
    if (product && product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        variant.productId = product.id;
        await Shop.createPriceVariant(variant);
      }
    }

    res.status(201).json({ id: productId });
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
    const { status, isDownload } = req.query;

    const filters = {
      status: status || '',
    };

    if (!shopId) {
      return res.status(400).json({ message: 'Shop Id is required' });
    }

    const orders = await Shop.getOrdersByShopId(shopId, filters);

    if (!orders.length) {
      res.status(204).json({ message: "No Order Found" });
      return;
    }

    if (isDownload === "No") {
      const ordersWithAddressDetails = await Promise.all(orders.map(async (item) => {
        const shippingAddress = await Shop.getAddressDetailsById(item.shippingAddressId);
        const billingAddress = await Shop.getAddressDetailsById(item.billingAddressId);
        const orderStatus = await Shop.getOrderStatusById(item.orderStatus);

        return {
          ...item,
          shippingAddress,
          billingAddress: billingAddress ? billingAddress : null,
          orderStatus: orderStatus.orderStatusName
        };
      }));

      res.status(200).json(ordersWithAddressDetails);
    } else {
      const orderForExport = await Promise.all(orders.map(async (item) => {
        const user = await User.getUserById(item.userId);
        const shippingAddress = await Shop.getAddressDetailsById(item.shippingAddressId);
        const billingAddress = await Shop.getAddressDetailsById(item.billingAddressId);
        // const orderStatus = await Shop.getOrderStatusById(item.orderStatus);


        const cartItems = await Orders.getOrderByOrderId(item.orderId);
        // Step 2: Fetch product info for each productId
        const products = await Promise.all(
          cartItems.map(async (cartItem) => {
            const product = await Product.getByProductId(cartItem.productId);
            return {
              ...product,
              orderQuantity: cartItem.quantity,
              orderProductPrice: cartItem.price
            };
          })
        );

        return {
          orderNumber: item.orderId,
          transportMode: "",
          paymentMode: "Prepaid",
          codAmount: 0,
          customerName: shippingAddress.firstName + ' ' + shippingAddress.lastName,
          phone: shippingAddress.phoneNumber,
          email: user ? user.email : '',
          shippingAddress: {
            address: shippingAddress.address,
            apartment: shippingAddress.landmark,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode
          },
          billingAddress: {
            address: billingAddress ? billingAddress.address : "",
            apartment: billingAddress ? billingAddress.landmark : "",
            city: billingAddress ? billingAddress.city : "",
            state: billingAddress ? billingAddress.state : "",
            pincode: billingAddress ? billingAddress.pincode : ""
          },
          products: products && products.length ?
            products.map((product) => ({
              skuCode: product.sku, skuName: product.skuCode, quantity: product.orderQuantity,
              price: product.orderQuantity
            })) : [],
          sellerInfo: {
            name: "FitMart",
            gst: "29ABCDE1234F2Z5",
            addressLine1: "88, Health Street",
            addressLine2: "Warehouse Zone",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560010"
          }
        };
      }));

      const csvData = await generateOrdersCSV(orderForExport);
      res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
      res.setHeader("Content-Type", "text/csv");
      res.status(200).send(csvData);
    }

  } catch (error) {
    console.log(error, 'error')
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
  let htmlBody = "";
  let subject = "";

  if (!orderId || !orderStatusId) {
    return res.status(400).json({ message: 'ID is Requried' });
  }

  try {
    const isStatusUpdated = await Shop.updateOrderStatus(orderStatusId, orderId);
    if (isStatusUpdated) {
      const orderStatus = await Shop.getOrderStatusById(orderStatusId);
      const orderDetails = await Shop.getOrderByOrderId(orderId);
      const user = await User.getUserById(orderDetails.userId);

      const emailData = {
        customerName: user.firstName + ' ' + user.lastName,
        invoiceId: orderId,
      }

      switch (orderStatus.orderStatusName) {
        case Constants.ORDER_STATUS.PROCESSING:
          emailData.statusChangeMessage = Constants.ORDER_STATUS_CHANGE_MESSAGE.PROCESSING;
          emailData.orderStatusInfo = `Processing Started`;
          subject = `Your ${Constants.STORE_NAME} Order #${emailData.invoiceId} - Update!`
          htmlBody = getStatusUpdateTemplate(emailData);
          break;
        case Constants.ORDER_STATUS.DISPATCHED:
          emailData.statusChangeMessage = Constants.ORDER_STATUS_CHANGE_MESSAGE.DISPATCHED;
          emailData.orderStatusInfo = `Dispatched`;
          subject = `Your ${Constants.STORE_NAME} Order #${emailData.invoiceId} - Update!`
          htmlBody = getStatusUpdateTemplate(emailData);
          break
        case Constants.ORDER_STATUS.DELIVERED:
          emailData.statusChangeMessage = Constants.ORDER_STATUS_CHANGE_MESSAGE.DELIVERED;
          emailData.orderStatusInfo = `Delivered`;
          subject = `Your ${Constants.STORE_NAME} Order #${emailData.invoiceId} - Update!`
          htmlBody = getStatusUpdateTemplate(emailData);
          break
        default:
          break;
      }

      await sendEmailWithAttachment({
        to: user.email,
        subject,
        html: htmlBody,
        attachments: [],
      });

      res.status(200).json(isStatusUpdated);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCoupons = async (req, res) => {
  const { shopId } = req.params;
  if (!shopId) {
    return res.status(400).json({ message: 'ShopId is requried' });
  }

  try {
    const allCoupons = await Shop.getAllCouponsByShopId(shopId);
    if (allCoupons && allCoupons.length) {
      return res.status(200).json(allCoupons);
    } else {
      return res.status(204).json({ message: 'No coupons found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getCouponById = async (req, res) => {
  const { shopId, couponId } = req.params;
  if (!shopId || !couponId) {
    return res.status(400).json({ message: 'Shop Id and Coupon ID is requried' });
  }

  try {
    const couponData = await Shop.getCouponById(shopId, couponId);
    if (couponData) {
      return res.status(200).json(couponData);
    } else {
      return res.status(204).json({ message: 'No coupon found for the ID' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.createCoupon = async (req, res) => {
  const couponData = req.body;
  const { shopId } = req.params;
  if (!shopId) {
    return res.status(400).json({ message: 'Shop ID is Requried' });
  }

  try {
    couponData.shopId = shopId;
    const insertId = await Shop.insertNewCoupon(couponData);
    if (insertId) {
      return res.status(200).json(insertId);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.updateCoupon = async (req, res) => {
  const couponData = req.body;
  const { couponId, shopId } = req.params;
  if (!shopId || !couponId) {
    return res.status(400).json({ message: 'Shop ID is Requried' });
  }

  try {
    const affectedRows = await Shop.updateCoupon(couponData, couponId);
    if (affectedRows) {
      return res.status(200).json(affectedRows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.updateCouponStatus = async (req, res) => {
  const { couponId } = req.params;
  const { isActive } = req.body;
  if (!couponId) {
    return res.status(400).json({ message: 'Shop ID is Requried' });
  }

  try {
    const affectedRows = await Shop.makeCouponInactive(isActive, couponId);
    if (affectedRows) {
      return res.status(200).json(affectedRows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getAllReviews = async (req, res) => {
  const { shopId } = req.params;
  if (!shopId) {
    return res.status(400).json({ message: "Shop ID is Required" });
  }

  try {
    const reviews = await Shop.getAllreviewsByShopId(shopId);

    const reviewsWithProducts = await Promise.all(reviews.map(async (review) => {
      const product = await Product.getByProductId(review.productId);
      return {
        ...review,
        productName: product.productName,
        productId: product.id,
        productSku: product.sku,
        productImage: product.imageUrl
      };
    }));

    if (reviewsWithProducts && reviewsWithProducts.length) {
      res.status(200).json(reviewsWithProducts);
    } else {
      res.status(204).json({ message: "No Reviews Found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.updateReviewStatus = async (req, res) => {
  const { shopId, reviewId } = req.params;
  const { isShow } = req.body;
  if (!shopId || !reviewId) {
    return res.status(400).json({ message: "Shop ID and Review ID is Required" });
  }

  try {
    const affectedRows = await Shop.updateReviewStatus(reviewId, isShow);
    if (affectedRows) {
      return res.status(200).json(affectedRows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.productAction = async (req, res) => {
  const { shopId } = req.params;
  const { productId, isPopular } = req.body;
  if (!shopId) {
    return res.status(400).json({ message: "Shop ID is Required" });
  }
  try {
    const affectedRows = await Shop.updatePopularStatus(productId, isPopular);
    if (affectedRows) {
      return res.status(200).json(affectedRows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


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