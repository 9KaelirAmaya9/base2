import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrderNotesPanel } from "@/components/admin/OrderNotesPanel";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import {
  Phone,
  Mail,
  MapPin,
  Package,
  Clock,
  FileText,
  User,
  DollarSign,
  Loader2,
} from "lucide-react";

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
  user_id: string | null;
}

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
}: OrderDetailsDialogProps) {
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (order && open) {
      fetchCustomerHistory();
    }
  }, [order, open]);

  const fetchCustomerHistory = async () => {
    if (!order) return;

    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(
          `customer_phone.eq.${order.customer_phone},customer_email.eq.${order.customer_email || ""}`
        )
        .neq("id", order.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setCustomerOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error fetching customer history:", error);
      setCustomerOrders([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "paid":
        return "bg-purple-500";
      case "preparing":
        return "bg-blue-500";
      case "ready":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getOrderTypeColor = (type: string) => {
    return type === "delivery" ? "default" : "secondary";
  };

  if (!order) return null;

  const totalSpent = customerOrders.reduce((sum, o) => {
    if (o.status !== "cancelled") {
      return sum + o.total;
    }
    return sum;
  }, order.total);

  const completedOrders = customerOrders.filter(
    (o) => o.status === "completed"
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              Order #{order.order_number}
            </DialogTitle>
            <Badge className={`${getStatusColor(order.status)} text-white`}>
              {order.status}
            </Badge>
          </div>
          <DialogDescription>
            Placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })} •{" "}
            {format(new Date(order.created_at), "PPpp")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
                {order.customer_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant={getOrderTypeColor(order.order_type)}>
                    {order.order_type}
                  </Badge>
                </div>
                {order.delivery_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{order.delivery_address}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm italic">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {Array.isArray(order.items) &&
                  order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} each
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">x{item.quantity}</div>
                        <div className="text-sm text-muted-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8.25%):</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(new Date(order.created_at), "PPpp")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{format(new Date(order.updated_at), "PPpp")}</span>
                </div>
              </div>
            </div>

            {/* Customer History */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Customer History
              </h3>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Customer Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        {completedOrders + 1}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Orders
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        ${totalSpent.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Spent
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        ${(totalSpent / (completedOrders + 1)).toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Order
                      </div>
                    </div>
                  </div>

                  {/* Previous Orders */}
                  {customerOrders.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Previous Orders ({customerOrders.length})
                      </h4>
                      <div className="space-y-2">
                        {customerOrders.slice(0, 5).map((prevOrder) => (
                          <div
                            key={prevOrder.id}
                            className="flex items-center justify-between bg-muted/30 rounded p-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono">
                                #{prevOrder.order_number}
                              </span>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(prevOrder.status)} text-white text-xs`}
                              >
                                {prevOrder.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground">
                                {format(
                                  new Date(prevOrder.created_at),
                                  "MMM dd"
                                )}
                              </span>
                              <span className="font-medium">
                                ${prevOrder.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {customerOrders.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      This is the customer's first order
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Notes */}
            <div>
              <OrderNotesPanel orderId={order.id} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
