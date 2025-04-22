export const Constants = {
  STORE_NAME: "Nilas Chips",
  ORDER_STATUS: {
    ORDERRECEIVED: 'Order Received',
    PROCESSING: 'Processing',
    PACKING: 'Packing',
    READYFORDISPATCH: 'Ready for Dispatch',
    DISPATCHED: 'Dispatched',
    OUTFORDELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered'
  },
  ORDER_STATUS_CHANGE_MESSAGE: {
    PROCESSING: `We're now processing your order and getting it ready for shipment. You'll receive another email with tracking information as soon as it becomes available`,
    DISPATCHED: `Good news! Your order has been dispatched. You’ll receive it soon at your doorstep.`,
    DELIVERED: `your order has been successfully delivered. We hope you enjoy your purchase!`
  }
}