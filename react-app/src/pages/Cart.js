import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    clearCart
  } = useCart();

  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customerInfo.name || !customerInfo.phone) {
      setError('Please provide your name and phone number');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    try {
      setSubmitting(true);

      // Format order data
      const orderData = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email || null,
        order_type: 'PICKUP',
        notes: customerInfo.notes || null,
        items: cartItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          customizations: item.customizations || null
        }))
      };

      const response = await api.post('/orders', orderData);

      // Clear cart and redirect to confirmation
      clearCart();
      navigate(`/order-confirmation/${response.data.data.id}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError(
        err.response?.data?.message || 'Failed to place order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyCart}>
          <h2 style={styles.emptyTitle}>Your cart is empty</h2>
          <p style={styles.emptyText}>Add some delicious tacos to get started!</p>
          <button
            onClick={() => navigate('/menu')}
            style={styles.menuButton}
          >
            View Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Your Order</h1>

        {/* Cart Items */}
        <div style={styles.cartSection}>
          {cartItems.map((item, index) => (
            <div key={`${item.id}-${item.customizations}-${index}`} style={styles.cartItem}>
              <div style={styles.itemDetails}>
                <h3 style={styles.itemName}>{item.name}</h3>
                {item.customizations && (
                  <p style={styles.customizations}>Note: {item.customizations}</p>
                )}
                <p style={styles.itemPrice}>${parseFloat(item.price).toFixed(2)} each</p>
              </div>

              <div style={styles.itemControls}>
                <div style={styles.quantityControls}>
                  <button
                    onClick={() => updateQuantity(item.id, item.customizations, item.quantity - 1)}
                    style={styles.quantityButton}
                  >
                    -
                  </button>
                  <span style={styles.quantity}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.customizations, item.quantity + 1)}
                    style={styles.quantityButton}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id, item.customizations)}
                  style={styles.removeButton}
                >
                  Remove
                </button>
              </div>

              <div style={styles.itemTotal}>
                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}

          <div style={styles.totalSection}>
            <span style={styles.totalLabel}>Total:</span>
            <span style={styles.totalAmount}>${getCartTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Information Form */}
        <div style={styles.checkoutSection}>
          <h2 style={styles.sectionTitle}>Checkout</h2>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmitOrder} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name *</label>
              <input
                type="text"
                name="name"
                value={customerInfo.name}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={customerInfo.phone}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email (optional)</label>
              <input
                type="email"
                name="email"
                value={customerInfo.email}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Special Instructions (optional)</label>
              <textarea
                name="notes"
                value={customerInfo.notes}
                onChange={handleInputChange}
                style={styles.textarea}
                rows="3"
                placeholder="Any special requests or dietary restrictions?"
              />
            </div>

            <div style={styles.pickupInfo}>
              <p style={styles.pickupText}>
                📍 Pickup only • Ready in 15-20 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitButton,
                ...(submitting ? styles.submitButtonDisabled : {})
              }}
            >
              {submitting ? 'Placing Order...' : `Place Order - $${getCartTotal().toFixed(2)}`}
            </button>
          </form>
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
    maxWidth: '800px',
    margin: '0 auto'
  },
  title: {
    fontSize: '36px',
    color: '#2d3748',
    marginBottom: '30px',
    fontWeight: 'bold'
  },
  cartSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  cartItem: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: '20px',
    padding: '20px 0',
    borderBottom: '1px solid #e2e8f0',
    alignItems: 'center'
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: '18px',
    color: '#2d3748',
    margin: '0 0 5px 0',
    fontWeight: '600'
  },
  customizations: {
    fontSize: '14px',
    color: '#718096',
    margin: '5px 0',
    fontStyle: 'italic'
  },
  itemPrice: {
    fontSize: '14px',
    color: '#718096',
    margin: '5px 0 0 0'
  },
  itemControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center'
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    padding: '5px'
  },
  quantityButton: {
    width: '30px',
    height: '30px',
    border: 'none',
    backgroundColor: '#667eea',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  quantity: {
    fontSize: '16px',
    fontWeight: '600',
    minWidth: '30px',
    textAlign: 'center'
  },
  removeButton: {
    fontSize: '12px',
    color: '#e53e3e',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  itemTotal: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2d3748'
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '20px',
    marginTop: '10px'
  },
  totalLabel: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2d3748'
  },
  totalAmount: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  checkoutSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#2d3748',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748'
  },
  input: {
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.2s ease'
  },
  textarea: {
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  pickupInfo: {
    backgroundColor: '#edf2f7',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '10px'
  },
  pickupText: {
    margin: 0,
    fontSize: '14px',
    color: '#2d3748',
    textAlign: 'center'
  },
  submitButton: {
    padding: '16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  submitButtonDisabled: {
    backgroundColor: '#a0aec0',
    cursor: 'not-allowed'
  },
  error: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  emptyCart: {
    textAlign: 'center',
    padding: '100px 20px'
  },
  emptyTitle: {
    fontSize: '32px',
    color: '#2d3748',
    marginBottom: '10px'
  },
  emptyText: {
    fontSize: '18px',
    color: '#718096',
    marginBottom: '30px'
  },
  menuButton: {
    padding: '12px 30px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Cart;
