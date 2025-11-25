import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  DollarSign, 
  ShoppingBag, 
  Clock,
  TrendingUp,
  ClipboardList,
  Users,
  Settings,
  Package,
  KeyRound
} from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Optimize: Fetch only what we need with separate queries for better performance
      const [todayOrdersResult, allOrdersResult, pendingOrdersResult, recentOrdersResult] = await Promise.all([
        // Today's orders and revenue
        supabase
          .from("orders")
          .select("id, total, created_at")
          .gte("created_at", todayISO)
          .order("created_at", { ascending: false }),
        // Total orders count (lightweight)
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true }),
        // Pending orders count
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        // Recent orders
        supabase
          .from("orders")
          .select("id, order_number, customer_name, customer_phone, status, total, created_at, order_type")
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      if (todayOrdersResult.error) throw todayOrdersResult.error;
      if (allOrdersResult.error) throw allOrdersResult.error;
      if (pendingOrdersResult.error) throw pendingOrdersResult.error;
      if (recentOrdersResult.error) throw recentOrdersResult.error;

      const ordersToday = todayOrdersResult.data || [];
      setTodayOrders(ordersToday.length);
      setTodayRevenue(ordersToday.reduce((sum, order) => sum + Number(order.total || 0), 0));
      setPendingOrders(pendingOrdersResult.count || 0);
      setTotalOrders(allOrdersResult.count || 0);
      setRecentOrders(recentOrdersResult.data || []);
      setError(null);
    } catch (error: any) {
      console.error("Failed to load metrics:", error);
      const errorMessage = error?.message || "Failed to load metrics";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMetrics]);

  const metrics = useMemo(() => [
    {
      title: "Today's Orders",
      value: todayOrders,
      icon: ShoppingBag,
      description: "Orders placed today",
      color: "text-blue-600"
    },
    {
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total earnings today",
      color: "text-green-600"
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Clock,
      description: "Awaiting confirmation",
      color: "text-orange-600"
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: TrendingUp,
      description: "All time orders",
      color: "text-purple-600"
    }
  ], [todayOrders, todayRevenue, pendingOrders, totalOrders]);

  const quickActions = useMemo(() => [
    {
      title: "View All Orders",
      description: "Manage and track orders",
      icon: ClipboardList,
      onClick: () => navigate("/admin/orders"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Manage Roles",
      description: "User permissions",
      icon: Users,
      onClick: () => navigate("/admin/roles"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Password Resets",
      description: "User password support",
      icon: KeyRound,
      onClick: () => navigate("/admin/passwords"),
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      title: "Kitchen Display",
      description: "View kitchen orders",
      icon: Package,
      onClick: () => navigate("/kitchen"),
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: "Settings",
      description: "Configure system",
      icon: Settings,
      onClick: () => navigate("/profile"),
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ], [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back! Here's your overview</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error: {error}</p>
              <Button onClick={loadMetrics} className="mt-4">Retry</Button>
            </CardContent>
          </Card>
        )}

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card 
                key={action.title}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={action.onClick}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Orders Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/admin/orders")}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{order.order_number}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          order.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          order.status === 'completed' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.customer_name} • {order.customer_phone}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {order.order_type} • {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">${Number(order.total).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
