import { stringify } from 'csv-stringify/sync';

export const generateOrdersCSV = async (orders) => {
  const rows = orders.flatMap(order => {
    return order.products.map((product) => ({
      "Sale Order Number": order.orderNumber,
      "Pickup Location Name": order.sellerInfo.name,
      "Transport Mode": order.transportMode,
      "Payment Mode": order.paymentMode,
      "COD Amount": order.codAmount || '',
      "Customer Name": order.customerName,
      "Customer Phone": order.phone,
      "Shipping Address Line1": order.shippingAddress?.address || '',
      "Shipping Address Line2": order.shippingAddress?.apartment || '',
      "Shipping City": order.shippingAddress?.city || '',
      "Shipping State": order.shippingAddress?.state || '',
      "Shipping Pincode": order.shippingAddress?.pincode || '',
      "Item Sku Code": product.skuCode,
      "Item Sku Name": product.skuName,
      "Quantity Ordered": product.quantity,
      "Packaging Type": '',
      "Unit Item Price": product.price,
      "Length (cm)": '',
      "Breadth (cm)": '',
      "Height (cm)": '',
      "Weight (gm)": '',
      "Fragile Shipment": '',
      "Discount Type": '',
      "Discount Value": '',
      "Tax Class Code": '',
      "Customer Email": order.email,
      "Billing Address same as Shipping Address": 'No',
      "Billing Address Line1": order.billingAddress?.address || '',
      "Billing Address Line2": order.billingAddress?.apartment || '',
      "Billing City": order.billingAddress?.city || '',
      "Billing State": order.billingAddress?.state || '',
      "Billing Pincode": order.billingAddress?.pincode || '',
      "e-Way Bill Number": '',
      "Seller Name": order.sellerInfo.name,
      "Seller GST Number": order.sellerInfo.gst,
      "Seller Address Line1": order.sellerInfo.addressLine1,
      "Seller Address Line2": order.sellerInfo.addressLine2,
      "Seller City": order.sellerInfo.city,
      "Seller State": order.sellerInfo.state,
      "Seller Pincode": order.sellerInfo.pincode
    }));
  });

  return stringify(rows, { header: true });
};