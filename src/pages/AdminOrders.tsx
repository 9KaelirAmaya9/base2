import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Search, Printer, RefreshCw, Edit, CheckSquare, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { printReceipt } from "@/utils/printReceipt";
import { exportToCSV, exportToJSON } from "@/utils/exportOrders";
import { OrderEditDialog } from "@/components/admin/OrderEditDialog";
import { OrderDetailsDialog } from "@/components/admin/OrderDetailsDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { OrderFilters } from "@/components/admin/OrderFilters";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    orderId: string;
    newStatus: string;
    orderNumber: string;
  } | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000); // Limit to prevent memory issues

      if (error) throw error;
      const ordersData = (data as Order[]) || [];
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          // Only refetch if it's an insert or update that affects our filters
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_phone.includes(searchTerm)
      );
    }

    // Status filter (multiple selection)
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((order) => selectedStatuses.includes(order.status));
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((order) => new Date(order.created_at) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => new Date(order.created_at) <= toDate);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, selectedStatuses, dateFrom, dateTo, orders]);

  const handleStatusChange = useCallback((orderId: string, newStatus: string, orderNumber: string) => {
    // Critical status changes require confirmation
    if (newStatus === "cancelled") {
      setPendingStatusChange({ orderId, newStatus, orderNumber });
      setConfirmDialogOpen(true);
    } else {
      updateOrderStatus(orderId, newStatus);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    try {
      // Optimistically update local state first
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      setFilteredOrders(prevFiltered =>
        prevFiltered.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order status updated");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
      // Refetch on error to ensure consistency
      fetchOrders();
    }
  }, [fetchOrders]);

  const handleConfirmStatusChange = useCallback(() => {
    if (pendingStatusChange) {
      updateOrderStatus(pendingStatusChange.orderId, pendingStatusChange.newStatus);
      setPendingStatusChange(null);
    }
  }, [pendingStatusChange, updateOrderStatus]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedStatuses([]);
    setDateFrom("");
    setDateTo("");
  }, []);

  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const toggleAllOrders = useCallback(() => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((order) => order.id));
    }
  }, [selectedOrderIds.length, filteredOrders]);

  const handleBulkStatusUpdate = useCallback(async (newStatus: string) => {
    if (selectedOrderIds.length === 0) {
      toast.error("No orders selected");
      return;
    }

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .in("id", selectedOrderIds);

      if (error) throw error;

      toast.success(`Updated ${selectedOrderIds.length} order(s) to ${newStatus}`);
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (error) {
      console.error("Error updating orders:", error);
      toast.error("Failed to update orders");
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedOrderIds, fetchOrders]);

  const handleBulkPrint = useCallback(() => {
    if (selectedOrderIds.length === 0) {
      toast.error("No orders selected");
      return;
    }

    const selectedOrders = filteredOrders.filter((order) =>
      selectedOrderIds.includes(order.id)
    );

    selectedOrders.forEach((order) => {
      const items = Array.isArray(order.items)
        ? order.items as Array<{ name: string; quantity: number; price: number }>
        : [];
      printReceipt({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        orderType: order.order_type,
        items: items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        createdAt: order.created_at,
        deliveryAddress: order.delivery_address || undefined,
        notes: order.notes || undefined,
      });
    });

    toast.success(`Printing ${selectedOrderIds.length} receipt(s)`);
  }, [selectedOrderIds, filteredOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Order Tracking</h1>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      exportToCSV(filteredOrders);
                      toast.success("Orders exported to CSV");
                    } catch (error) {
                      toast.error("Failed to export orders");
                    }
                  }}
                >
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      exportToJSON(filteredOrders);
                      toast.success("Orders exported to JSON");
                    } catch (error) {
                      toast.error("Failed to export orders");
                    }
                  }}
                >
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <OrderFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedStatuses={selectedStatuses}
              onStatusesChange={setSelectedStatuses}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onClearFilters={handleClearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Orders ({filteredOrders.length})</CardTitle>
              {selectedOrderIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {selectedOrderIds.length} selected
                  </Badge>
                  <Select
                    onValueChange={(value) => {
                      if (value === "print") {
                        handleBulkPrint();
                      } else {
                        handleBulkStatusUpdate(value);
                      }
                    }}
                    disabled={bulkActionLoading}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Bulk actions..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preparing">Set to Preparing</SelectItem>
                      <SelectItem value="ready">Set to Ready</SelectItem>
                      <SelectItem value="completed">Set to Completed</SelectItem>
                      <SelectItem value="cancelled">Set to Cancelled</SelectItem>
                      <SelectItem value="print">Print All</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrderIds([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          filteredOrders.length > 0 &&
                          selectedOrderIds.length === filteredOrders.length
                        }
                        onCheckedChange={toggleAllOrders}
                      />
                    </TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className={selectedOrderIds.includes(order.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedOrderIds.includes(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                        />
                      </TableCell>
                      <TableCell
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailsDialogOpen(true);
                        }}
                        title="Click to view details"
                      >
                        {order.order_number}
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), "MMM dd, HH:mm")}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.order_type === "delivery" ? "default" : "secondary"}>
                          {order.order_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(order.items) ? order.items.length : 0} items
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value, order.order_number)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(order.status)} text-white`}>
                                {order.status}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setEditDialogOpen(true);
                            }}
                            title="Edit order"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const items = Array.isArray(order.items)
                                ? order.items as Array<{ name: string; quantity: number; price: number }>
                                : [];
                              printReceipt({
                                orderNumber: order.order_number,
                                customerName: order.customer_name,
                                orderType: order.order_type,
                                items: items,
                                subtotal: order.subtotal,
                                tax: order.tax,
                                total: order.total,
                                createdAt: order.created_at,
                                deliveryAddress: order.delivery_address || undefined,
                                notes: order.notes || undefined,
                              });
                            }}
                            title="Print receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OrderEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        order={selectedOrder}
        onOrderUpdated={fetchOrders}
      />

      <OrderDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        order={selectedOrder}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Cancel Order"
        description={`Are you sure you want to cancel order ${pendingStatusChange?.orderNumber}? This action will mark the order as cancelled.`}
        onConfirm={handleConfirmStatusChange}
        confirmText="Cancel Order"
        cancelText="Keep Order"
        variant="destructive"
      />
    </div>
  );
}
