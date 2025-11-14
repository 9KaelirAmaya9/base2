import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { printReceipt } from "@/utils/printReceipt";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Users,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Printer
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationSettings } from "@/components/NotificationSettings";
import { RoleManagement } from "@/components/admin/RoleManagement";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  order_type: string;
  delivery_address: string | null;
  items: any;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      await fetchOrders();
    };
    loadData();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      
      toast.success("Order status updated");
      fetchOrders();
    } catch (error: any) {
      toast.error("Failed to update order status");
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

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      confirmed: "secondary",
      preparing: "secondary",
      ready: "default",
      completed: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const filteredOrders = selectedStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  // Calculate analytics
  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);
  
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground break-words">Welcome back, {user?.email}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
          <NotificationSettings />

          {/* Analytics Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">Done: {completedOrders}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Avg Order</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per order</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{pendingOrders}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
          </div>

          {/* Role Management */}
          <RoleManagement />

          {/* Orders List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">Recent Orders</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Manage and track orders</CardDescription>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="space-y-3 md:space-y-4">
                {filteredOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No orders found</p>
                ) : (
                  filteredOrders.map((order) => (
                    <Card key={order.id} className="p-3 md:p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-sm md:text-base truncate">{order.order_number}</h3>
                              {getStatusBadge(order.status)}
                              <Badge variant="outline" className="text-xs">{order.order_type}</Badge>
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                              <p className="break-words"><strong>Customer:</strong> {order.customer_name}</p>
                              <p className="break-words"><strong>Phone:</strong> {order.customer_phone}</p>
                              {order.customer_email && <p className="break-words"><strong>Email:</strong> {order.customer_email}</p>}
                              {order.delivery_address && <p className="break-words"><strong>Address:</strong> {order.delivery_address}</p>}
                              <p><strong>Total:</strong> ${Number(order.total).toFixed(2)}</p>
                              <p><strong>Items:</strong> {Array.isArray(order.items) ? order.items.length : 0} item(s)</p>
                              {order.notes && <p className="break-words"><strong>Notes:</strong> {order.notes}</p>}
                              <p className="text-xs"><strong>Ordered:</strong> {new Date(order.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="preparing">Preparing</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintReceipt(order)}
                              className="gap-2 shrink-0"
                            >
                              <Printer className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="hidden sm:inline">Print</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default Admin;