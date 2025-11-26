import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
    // Poll for order updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      NEW: '#3b82f6',
      IN_PROGRESS: '#f59e0b',
      READY: '#10b981',
      COMPLETED: '#6b7280',
      CANCELLED: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const texts = {
      NEW: 'Order Received',
      IN_PROGRESS: 'Being Prepared',
      READY: 'Ready for Pickup!',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          {error || 'Order not found'}
          <button onClick={() => navigate('/menu')} style={styles.backButton}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Success Header */}
        <div style={styles.successHeader}>
          <div style={styles.checkmark}>✓</div>
          <h1 style={styles.title}>Order Confirmed!</h1>
          <p style={styles.subtitle}>
            Thank you, {order.customer_name}! Your order has been received.
          </p>
        </div>

        {/* Order Number */}
        <div style={styles.orderNumber}>
          <span style={styles.orderNumberLabel}>Order #</span>
          <span style={styles.orderNumberValue}>{order.id}</span>
        </div>

        {/* Order Status */}
        <div style={styles.statusCard}>
          <div
            style={{
              ...styles.statusBadge,
              backgroundColor: getStatusColor(order.status)
            }}
          >
            {getStatusText(order.status)}
          </div>
          {order.status === 'READY' && (
            <p style={styles.readyMessage}>
              🎉 Your order is ready! Please come pick it up.
            </p>
          )}
        </div>

        {/* Order Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Order Details</h2>
          <div style={styles.detailsCard}>
            {order.items.map((item, index) => (
              <div key={index} style={styles.orderItem}>
                <div style={styles.itemInfo}>
                  <span style={styles.itemQuantity}>{item.quantity}x</span>
                  <div>
                    <div style={styles.itemName}>{item.menu_item_name}</div>
                    {item.customizations && (
                      <div style={styles.itemCustomizations}>
                        Note: {item.customizations}
                      </div>
                    )}
                  </div>
                </div>
                <div style={styles.itemPrice}>
                  ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total</span>
              <span style={styles.totalAmount}>
                ${parseFloat(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Contact & Pickup Info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Pickup Information</h2>
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Name:</span>
              <span style={styles.infoValue}>{order.customer_name}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Phone:</span>
              <span style={styles.infoValue}>{order.customer_phone}</span>
            </div>
            {order.customer_email && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Email:</span>
                <span style={styles.infoValue}>{order.customer_email}</span>
              </div>
            )}
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Order Type:</span>
              <span style={styles.infoValue}>{order.order_type}</span>
            </div>
            {order.notes && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Special Instructions:</span>
                <span style={styles.infoValue}>{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Time Estimate */}
        <div style={styles.estimateCard}>
          <p style={styles.estimateText}>
            ⏱️ Estimated pickup time: 15-20 minutes
          </p>
          <p style={styles.estimateSubtext}>
            We'll prepare your order fresh! Check back here for status updates.
          </p>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={() => navigate('/menu')} style={styles.menuButton}>
            Back to Menu
          </button>
          <button onClick={() => navigate('/')} style={styles.homeButton}>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '20px'
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto'
  },
  successHeader: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  checkmark: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    animation: 'fadeIn 0.5s ease'
  },
  title: {
    fontSize: '36px',
    color: '#2d3748',
    margin: '0 0 10px 0',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: '18px',
    color: '#718096',
    margin: 0
  },
  orderNumber: {
    textAlign: 'center',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  orderNumberLabel: {
    fontSize: '14px',
    color: '#718096',
    marginRight: '10px'
  },
  orderNumberValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  statusCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '10px 20px',
    borderRadius: '25px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  readyMessage: {
    marginTop: '15px',
    fontSize: '18px',
    color: '#10b981',
    fontWeight: '600'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#2d3748',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  detailsCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  itemInfo: {
    display: 'flex',
    gap: '10px',
    flex: 1
  },
  itemQuantity: {
    fontWeight: 'bold',
    color: '#667eea',
    minWidth: '30px'
  },
  itemName: {
    fontSize: '16px',
    color: '#2d3748',
    fontWeight: '600'
  },
  itemCustomizations: {
    fontSize: '14px',
    color: '#718096',
    fontStyle: 'italic',
    marginTop: '5px'
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2d3748'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '15px',
    marginTop: '10px'
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2d3748'
  },
  totalAmount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  infoCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  infoLabel: {
    fontSize: '14px',
    color: '#718096',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: '14px',
    color: '#2d3748'
  },
  estimateCard: {
    backgroundColor: '#edf2f7',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  estimateText: {
    fontSize: '16px',
    color: '#2d3748',
    fontWeight: '600',
    margin: '0 0 10px 0'
  },
  estimateSubtext: {
    fontSize: '14px',
    color: '#718096',
    margin: 0
  },
  actions: {
    display: 'flex',
    gap: '15px'
  },
  menuButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  homeButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '100px 20px',
    fontSize: '18px',
    color: '#718096'
  },
  error: {
    textAlign: 'center',
    padding: '100px 20px',
    fontSize: '18px',
    color: '#e53e3e',
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
    margin: '20px'
  },
  backButton: {
    marginTop: '20px',
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer'
  }
};

export default OrderConfirmation;
