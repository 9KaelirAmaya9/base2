import React, { useState, useEffect } from 'react';
import api from '../services/api';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveOrders();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchActiveOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/list/active');
      setOrders(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchActiveOrders();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update order status');
    }
  };

  const getTimeSince = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMinutes = Math.floor((now - created) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  const getCardColor = (status, createdAt) => {
    const minutesOld = Math.floor((new Date() - new Date(createdAt)) / 60000);

    if (status === 'NEW') {
      if (minutesOld > 15) return '#fee2e2'; // Red tint for old new orders
      return '#dbeafe'; // Blue for new orders
    }
    return '#fef3c7'; // Yellow for in progress
  };

  const newOrders = orders.filter(o => o.status === 'NEW');
  const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🍳 Kitchen Dashboard</h1>
        <div style={styles.stats}>
          <div style={styles.statBadge}>
            <span style={styles.statNumber}>{newOrders.length}</span>
            <span style={styles.statLabel}>New</span>
          </div>
          <div style={styles.statBadge}>
            <span style={styles.statNumber}>{inProgressOrders.length}</span>
            <span style={styles.statLabel}>In Progress</span>
          </div>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {orders.length === 0 && !loading && (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>No Active Orders</h2>
          <p style={styles.emptyText}>All caught up! 🎉</p>
        </div>
      )}

      <div style={styles.content}>
        {/* New Orders Section */}
        {newOrders.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              🔔 New Orders ({newOrders.length})
            </h2>
            <div style={styles.ordersGrid}>
              {newOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  getTimeSince={getTimeSince}
                  getCardColor={getCardColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Orders Section */}
        {inProgressOrders.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              👨‍🍳 In Progress ({inProgressOrders.length})
            </h2>
            <div style={styles.ordersGrid}>
              {inProgressOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  getTimeSince={getTimeSince}
                  getCardColor={getCardColor}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderCard = ({ order, onUpdateStatus, getTimeSince, getCardColor }) => {
  const isNew = order.status === 'NEW';
  const isOld = Math.floor((new Date() - new Date(order.created_at)) / 60000) > 15;

  return (
    <div
      style={{
        ...styles.orderCard,
        backgroundColor: getCardColor(order.status, order.created_at),
        ...(isNew && isOld ? styles.urgentOrder : {})
      }}
    >
      {/* Order Header */}
      <div style={styles.orderHeader}>
        <div>
          <h3 style={styles.orderNumber}>Order #{order.id}</h3>
          <div style={styles.timeInfo}>
            <span style={styles.timeText}>{getTimeSince(order.created_at)}</span>
            {isNew && isOld && <span style={styles.urgentBadge}>⚠️ URGENT</span>}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div style={styles.customerInfo}>
        <div style={styles.customerName}>👤 {order.customer_name}</div>
        <div style={styles.customerPhone}>📱 {order.customer_phone}</div>
      </div>

      {/* Order Items */}
      <div style={styles.itemsList}>
        {order.items.map((item, idx) => (
          <div key={idx} style={styles.item}>
            <span style={styles.itemQuantity}>{item.quantity}x</span>
            <div style={styles.itemDetails}>
              <div style={styles.itemName}>{item.menu_item_name}</div>
              {item.customizations && (
                <div style={styles.itemNotes}>📝 {item.customizations}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Special Notes */}
      {order.notes && (
        <div style={styles.specialNotes}>
          <strong>Special Instructions:</strong> {order.notes}
        </div>
      )}

      {/* Action Buttons */}
      <div style={styles.actions}>
        {order.status === 'NEW' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'IN_PROGRESS')}
            style={styles.startButton}
          >
            ▶️ Start Preparing
          </button>
        )}
        {order.status === 'IN_PROGRESS' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'READY')}
            style={styles.readyButton}
          >
            ✅ Mark Ready
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a202c',
    color: 'white'
  },
  header: {
    backgroundColor: '#2d3748',
    padding: '30px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  },
  title: {
    fontSize: '36px',
    margin: 0,
    fontWeight: 'bold'
  },
  stats: {
    display: 'flex',
    gap: '20px'
  },
  statBadge: {
    backgroundColor: '#4a5568',
    padding: '15px 25px',
    borderRadius: '12px',
    textAlign: 'center',
    minWidth: '100px'
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#fbbf24'
  },
  statLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#cbd5e0',
    marginTop: '5px'
  },
  content: {
    padding: '30px 20px'
  },
  section: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#f7fafc',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  ordersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  orderCard: {
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s ease',
    border: '2px solid transparent'
  },
  urgentOrder: {
    border: '2px solid #ef4444',
    animation: 'pulse 2s infinite'
  },
  orderHeader: {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid rgba(0,0,0,0.1)'
  },
  orderNumber: {
    fontSize: '20px',
    color: '#1a202c',
    margin: '0 0 5px 0',
    fontWeight: 'bold'
  },
  timeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  timeText: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '600'
  },
  urgentBadge: {
    fontSize: '12px',
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '8px',
    fontWeight: 'bold'
  },
  customerInfo: {
    marginBottom: '15px',
    fontSize: '14px',
    color: '#2d3748'
  },
  customerName: {
    fontWeight: '600',
    marginBottom: '5px'
  },
  customerPhone: {
    color: '#4a5568'
  },
  itemsList: {
    marginBottom: '15px'
  },
  item: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  itemQuantity: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#667eea',
    minWidth: '40px'
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '4px'
  },
  itemNotes: {
    fontSize: '13px',
    color: '#4a5568',
    fontStyle: 'italic'
  },
  specialNotes: {
    backgroundColor: 'rgba(255,165,0,0.2)',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#1a202c',
    marginBottom: '15px',
    border: '1px solid rgba(255,165,0,0.4)'
  },
  actions: {
    display: 'flex',
    gap: '10px'
  },
  startButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  readyButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '15px',
    margin: '20px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  emptyState: {
    textAlign: 'center',
    padding: '100px 20px',
    color: '#cbd5e0'
  },
  emptyTitle: {
    fontSize: '32px',
    marginBottom: '10px'
  },
  emptyText: {
    fontSize: '18px'
  }
};

export default KitchenDashboard;
