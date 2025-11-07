import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Package, ChefHat, Printer } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { printReceipt } from "@/utils/printReceipt";
import { NotificationSettings } from "@/components/NotificationSettings";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  delivery_address?: string | null;
  notes?: string | null;
  created_at: string;
}

const Kitchen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing"])
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to fetch orders");
      console.error(error);
    } else {
      setOrders((data || []) as unknown as Order[]);
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update status");
      console.error(error);
    } else {
      toast.success("Order status updated");
      fetchOrders();
    }
  };

  const handlePrintReceipt = (order: Order) => {
    try {
      printReceipt({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        orderType: order.order_type,
        items: order.items,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        deliveryAddress: order.delivery_address || undefined,
        notes: order.notes || undefined,
        createdAt: order.created_at,
      });
      toast.success('Printing receipt...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: string) => {
    return status === "pending" ? "bg-yellow-500" : "bg-blue-500";
  };

  const getTimeElapsed = (createdAt: string) => {
    const minutes = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / 60000
    );
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ChefHat className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="kitchen">
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ChefHat className="h-8 w-8 md:h-10 md:w-10 text-primary shrink-0" />
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Kitchen Display</h1>
                  <p className="text-sm text-muted-foreground">
                    {orders.length} active {orders.length === 1 ? "order" : "orders"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Auto-refreshing</p>
                <p className="text-lg md:text-xl font-bold">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <NotificationSettings />

          {orders.length === 0 ? (
            <Card className="p-8 md:p-12 text-center">
              <Package className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl md:text-2xl font-semibold mb-2">No Active Orders</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                All orders are completed or ready for pickup
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="border-2 hover:shadow-lg transition-shadow flex flex-col"
                >
                  <CardHeader className={`${getStatusColor(order.status)} text-white`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl md:text-3xl font-bold mb-1">
                          {order.order_number.split("-")[2]}
                        </CardTitle>
                        <p className="text-xs md:text-sm opacity-90 flex items-center gap-1">
                          <Clock className="h-3 w-3 md:h-4 md:w-4" />
                          {getTimeElapsed(order.created_at)} ago
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-sm md:text-base px-2 md:px-3 py-1 font-semibold bg-white/20"
                      >
                        {order.order_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Customer</p>
                      <p className="font-semibold text-base md:text-lg break-words">{order.customer_name}</p>
                    </div>

                    <div className="mb-6 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 font-semibold">
                        Items:
                      </p>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-muted/50 p-2 md:p-3 rounded-lg gap-2"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-bold text-base md:text-lg bg-primary text-primary-foreground rounded-full h-6 w-6 md:h-7 md:w-7 flex items-center justify-center shrink-0">
                                {item.quantity}
                              </span>
                              <span className="font-medium text-sm md:text-base break-words">{item.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 mt-auto">
                      {order.status === "pending" && (
                        <Button
                          onClick={() => updateStatus(order.id, "preparing")}
                          className="w-full text-sm md:text-base font-semibold"
                          size="lg"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button
                          onClick={() => updateStatus(order.id, "ready")}
                          className="w-full text-sm md:text-base font-semibold"
                          size="lg"
                        >
                          Mark Ready
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handlePrintReceipt(order)}
                        className="w-full gap-2"
                        size="sm"
                      >
                        <Printer className="h-3 w-3 md:h-4 md:w-4" />
                        Print Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Kitchen;
