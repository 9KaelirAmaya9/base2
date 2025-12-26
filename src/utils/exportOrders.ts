import { format } from "date-fns";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_type: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function exportToCSV(orders: Order[], filename?: string) {
  if (orders.length === 0) {
    throw new Error("No orders to export");
  }

  // CSV Headers
  const headers = [
    "Order Number",
    "Date",
    "Time",
    "Customer Name",
    "Customer Phone",
    "Customer Email",
    "Order Type",
    "Status",
    "Items",
    "Quantity",
    "Subtotal",
    "Tax",
    "Total",
    "Delivery Address",
    "Notes",
  ];

  // Convert orders to CSV rows
  const rows = orders.map((order) => {
    const itemsList = Array.isArray(order.items)
      ? order.items
          .map((item) => `${item.name} (${item.quantity}x)`)
          .join("; ")
      : "";

    const totalQuantity = Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;

    return [
      order.order_number,
      format(new Date(order.created_at), "yyyy-MM-dd"),
      format(new Date(order.created_at), "HH:mm:ss"),
      escapeCSV(order.customer_name),
      escapeCSV(order.customer_phone),
      escapeCSV(order.customer_email || ""),
      order.order_type,
      order.status,
      escapeCSV(itemsList),
      totalQuantity,
      order.subtotal.toFixed(2),
      order.tax.toFixed(2),
      order.total.toFixed(2),
      escapeCSV(order.delivery_address || ""),
      escapeCSV(order.notes || ""),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename || `orders-export-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function exportToJSON(orders: Order[], filename?: string) {
  if (orders.length === 0) {
    throw new Error("No orders to export");
  }

  // Format data for export
  const exportData = orders.map((order) => ({
    orderNumber: order.order_number,
    date: format(new Date(order.created_at), "yyyy-MM-dd HH:mm:ss"),
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    orderType: order.order_type,
    status: order.status,
    items: order.items,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    deliveryAddress: order.delivery_address,
    notes: order.notes,
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);

  // Create and download file
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename || `orders-export-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (!value) return "";

  // If value contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
