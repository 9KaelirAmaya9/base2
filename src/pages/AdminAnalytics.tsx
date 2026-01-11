import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Clock,
  Package,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_type: string;
  status: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  user_id: string | null;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orderCount: number;
}

interface ItemStat {
  name: string;
  quantity: number;
  revenue: number;
}

interface HourlyDistribution {
  hour: number;
  orderCount: number;
}

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // Last 30 days by default

  // Metrics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topItems, setTopItems] = useState<ItemStat[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<HourlyDistribution[]>([]);
  const [deliveryPickupRatio, setDeliveryPickupRatio] = useState({ delivery: 0, pickup: 0 });
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchOrders();
  }, [dateRange]);

  useEffect(() => {
    if (orders.length > 0) {
      calculateMetrics();
    }
  }, [orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), dateRange));

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Cast through unknown since Supabase Json type doesn't directly match our Order type
      setOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    // Filter out cancelled orders for revenue calculations
    const completedOrders = orders.filter((o) => o.status !== "cancelled");

    // Total Revenue
    const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    setTotalRevenue(revenue);

    // Total Orders
    setTotalOrders(completedOrders.length);

    // Average Order Value
    setAvgOrderValue(completedOrders.length > 0 ? revenue / completedOrders.length : 0);

    // Unique Customers (by phone number)
    const uniquePhones = new Set(completedOrders.map((o) => o.customer_phone));
    setUniqueCustomers(uniquePhones.size);

    // Daily Revenue Trend
    const revenueByDate: Record<string, { revenue: number; count: number }> = {};
    completedOrders.forEach((order) => {
      const date = format(parseISO(order.created_at), "yyyy-MM-dd");
      if (!revenueByDate[date]) {
        revenueByDate[date] = { revenue: 0, count: 0 };
      }
      revenueByDate[date].revenue += order.total;
      revenueByDate[date].count += 1;
    });

    const dailyData: DailyRevenue[] = Object.entries(revenueByDate)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orderCount: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setDailyRevenue(dailyData);

    // Top Items
    const itemStats: Record<string, { quantity: number; revenue: number }> = {};
    completedOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!itemStats[item.name]) {
            itemStats[item.name] = { quantity: 0, revenue: 0 };
          }
          itemStats[item.name].quantity += item.quantity;
          itemStats[item.name].revenue += item.price * item.quantity;
        });
      }
    });

    const topItemsData: ItemStat[] = Object.entries(itemStats)
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    setTopItems(topItemsData);

    // Hourly Distribution
    const hourlyStats: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = 0;
    }
    completedOrders.forEach((order) => {
      const hour = parseISO(order.created_at).getHours();
      hourlyStats[hour] += 1;
    });

    const hourlyData: HourlyDistribution[] = Object.entries(hourlyStats).map(
      ([hour, count]) => ({
        hour: parseInt(hour),
        orderCount: count,
      })
    );
    setHourlyDistribution(hourlyData);

    // Delivery vs Pickup
    const delivery = completedOrders.filter((o) => o.order_type === "delivery").length;
    const pickup = completedOrders.filter((o) => o.order_type === "pickup").length;
    setDeliveryPickupRatio({ delivery, pickup });

    // Status Breakdown (all orders including cancelled)
    const statusStats: Record<string, number> = {};
    orders.forEach((order) => {
      statusStats[order.status] = (statusStats[order.status] || 0) + 1;
    });
    setStatusBreakdown(statusStats);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Insights and metrics for your restaurant
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange(7)}
            className={`px-4 py-2 rounded-lg ${
              dateRange === 7 ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange(30)}
            className={`px-4 py-2 rounded-lg ${
              dateRange === 30 ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange(90)}
            className={`px-4 py-2 rounded-lg ${
              dateRange === 90 ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Excluding cancelled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per completed order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              By phone number
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="items">Top Items</TabsTrigger>
          <TabsTrigger value="timing">Order Timing</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trend</CardTitle>
              <CardDescription>
                Revenue and order count over the last {dateRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyRevenue.length > 0 ? (
                  dailyRevenue.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <div className="font-medium">
                          {format(parseISO(day.date), "MMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {day.orderCount} orders
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          ${day.revenue.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${(day.revenue / day.orderCount).toFixed(2)} avg
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No revenue data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Menu Items</CardTitle>
              <CardDescription>
                Best performing items by revenue and quantity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topItems.length > 0 ? (
                  topItems.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} sold
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${item.revenue.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          ${(item.revenue / item.quantity).toFixed(2)} avg
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No items data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Timing Tab */}
        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Clock className="inline h-5 w-5 mr-2" />
                Hourly Order Distribution
              </CardTitle>
              <CardDescription>
                When do most orders come in? (24-hour format)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hourlyDistribution
                  .filter((h) => h.orderCount > 0)
                  .sort((a, b) => b.orderCount - a.orderCount)
                  .map((hourData) => {
                    const maxOrders = Math.max(...hourlyDistribution.map((h) => h.orderCount));
                    const barWidth = maxOrders > 0 ? (hourData.orderCount / maxOrders) * 100 : 0;

                    return (
                      <div key={hourData.hour} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {hourData.hour.toString().padStart(2, "0")}:00 - {(hourData.hour + 1).toString().padStart(2, "0")}:00
                          </span>
                          <span className="text-muted-foreground">
                            {hourData.orderCount} orders
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                {hourlyDistribution.every((h) => h.orderCount === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders in this time period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Package className="inline h-5 w-5 mr-2" />
                  Order Type Breakdown
                </CardTitle>
                <CardDescription>
                  Delivery vs Pickup distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Delivery</span>
                    <span className="text-muted-foreground">
                      {deliveryPickupRatio.delivery} orders (
                      {((deliveryPickupRatio.delivery / totalOrders) * 100 || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{
                        width: `${(deliveryPickupRatio.delivery / totalOrders) * 100 || 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Pickup</span>
                    <span className="text-muted-foreground">
                      {deliveryPickupRatio.pickup} orders (
                      {((deliveryPickupRatio.pickup / totalOrders) * 100 || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{
                        width: `${(deliveryPickupRatio.pickup / totalOrders) * 100 || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Breakdown</CardTitle>
                <CardDescription>
                  Distribution across all order statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statusBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(status)} text-white`}>
                            {status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{count}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({((count / orders.length) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
