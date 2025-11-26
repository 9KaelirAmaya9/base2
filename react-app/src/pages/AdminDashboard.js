import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Menu form state
  const [menuForm, setMenuForm] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_available: true,
    is_special: false
  });

  const [showMenuForm, setShowMenuForm] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
    fetchOrders();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/menu/categories');
      setCategories(response.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu/items');
      setMenuItems(response.data.data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    }
  };

  const handleMenuFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMenuForm({
      ...menuForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCreateMenuItem = () => {
    setMenuForm({
      id: null,
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      is_available: true,
      is_special: false
    });
    setShowMenuForm(true);
  };

  const handleEditMenuItem = (item) => {
    setMenuForm({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category_id,
      is_available: item.is_available,
      is_special: item.is_special
    });
    setShowMenuForm(true);
  };

  const handleSubmitMenuItem = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (menuForm.id) {
        // Update
        await api.put(`/menu/items/${menuForm.id}`, menuForm);
        setSuccess('Menu item updated successfully');
      } else {
        // Create
        await api.post('/menu/items', menuForm);
        setSuccess('Menu item created successfully');
      }

      setShowMenuForm(false);
      fetchMenuItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await api.delete(`/menu/items/${id}`);
      setSuccess('Menu item deleted successfully');
      fetchMenuItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete menu item');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setSuccess('Order status updated');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const renderMenuManagement = () => (
    <div>
      <div style={styles.header}>
        <h2 style={styles.tabTitle}>Menu Management</h2>
        <button onClick={handleCreateMenuItem} style={styles.primaryButton}>
          + Add Menu Item
        </button>
      </div>

      {showMenuForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {menuForm.id ? 'Edit Menu Item' : 'New Menu Item'}
          </h3>
          <form onSubmit={handleSubmitMenuItem} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={menuForm.name}
                  onChange={handleMenuFormChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={menuForm.price}
                  onChange={handleMenuFormChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={menuForm.description}
                onChange={handleMenuFormChange}
                style={styles.textarea}
                rows="3"
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category *</label>
                <select
                  name="category_id"
                  value={menuForm.category_id}
                  onChange={handleMenuFormChange}
                  style={styles.select}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_available"
                  checked={menuForm.is_available}
                  onChange={handleMenuFormChange}
                  style={styles.checkbox}
                />
                Available
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_special"
                  checked={menuForm.is_special}
                  onChange={handleMenuFormChange}
                  style={styles.checkbox}
                />
                Special
              </label>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => setShowMenuForm(false)}
                style={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={styles.primaryButton}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>
                  {item.name}
                  {item.is_special && <span style={styles.badge}>⭐</span>}
                </td>
                <td style={styles.td}>{item.category_name}</td>
                <td style={styles.td}>${parseFloat(item.price).toFixed(2)}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: item.is_available ? '#10b981' : '#ef4444'
                    }}
                  >
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleEditMenuItem(item)}
                    style={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrderManagement = () => (
    <div>
      <h2 style={styles.tabTitle}>Order Management</h2>

      <div style={styles.ordersGrid}>
        {orders.map(order => (
          <div key={order.id} style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <h3 style={styles.orderNumber}>Order #{order.id}</h3>
              <select
                value={order.status}
                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                style={styles.statusSelect}
              >
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY">Ready</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div style={styles.orderInfo}>
              <p style={styles.orderDetail}>
                <strong>Customer:</strong> {order.customer_name}
              </p>
              <p style={styles.orderDetail}>
                <strong>Phone:</strong> {order.customer_phone}
              </p>
              <p style={styles.orderDetail}>
                <strong>Time:</strong> {new Date(order.created_at).toLocaleString()}
              </p>
              <p style={styles.orderDetail}>
                <strong>Total:</strong> ${parseFloat(order.total_amount).toFixed(2)}
              </p>
            </div>

            <div style={styles.orderItems}>
              <strong>Items:</strong>
              {order.items.map((item, idx) => (
                <div key={idx} style={styles.orderItemRow}>
                  {item.quantity}x {item.menu_item_name}
                </div>
              ))}
            </div>

            {order.notes && (
              <div style={styles.orderNotes}>
                <strong>Notes:</strong> {order.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.dashboardHeader}>
        <h1 style={styles.title}>Admin Dashboard</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            ...styles.tab,
            ...(activeTab === 'menu' ? styles.tabActive : {})
          }}
        >
          Menu Management
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            ...styles.tab,
            ...(activeTab === 'orders' ? styles.tabActive : {})
          }}
        >
          Order Management
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'menu' && renderMenuManagement()}
        {activeTab === 'orders' && renderOrderManagement()}
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
  dashboardHeader: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '40px 20px',
    borderRadius: '12px 12px 0 0',
    marginBottom: 0
  },
  title: {
    fontSize: '36px',
    margin: 0,
    textAlign: 'center'
  },
  tabs: {
    display: 'flex',
    backgroundColor: 'white',
    borderBottom: '2px solid #e2e8f0'
  },
  tab: {
    flex: 1,
    padding: '15px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#718096',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s ease'
  },
  tabActive: {
    color: '#667eea',
    borderBottomColor: '#667eea'
  },
  content: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '0 0 12px 12px',
    minHeight: '500px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  tabTitle: {
    fontSize: '24px',
    color: '#2d3748',
    margin: 0
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  formCard: {
    backgroundColor: '#f7fafc',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  formTitle: {
    fontSize: '18px',
    color: '#2d3748',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748'
  },
  input: {
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px'
  },
  textarea: {
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  select: {
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  checkboxRow: {
    display: 'flex',
    gap: '20px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#2d3748',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#f7fafc',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748'
  },
  tr: {
    borderBottom: '1px solid #e2e8f0'
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#2d3748'
  },
  badge: {
    marginLeft: '8px',
    fontSize: '12px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white'
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    marginRight: '8px'
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  ordersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  orderCard: {
    backgroundColor: '#f7fafc',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e2e8f0'
  },
  orderNumber: {
    fontSize: '18px',
    color: '#667eea',
    margin: 0
  },
  statusSelect: {
    padding: '6px 10px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  orderInfo: {
    marginBottom: '15px'
  },
  orderDetail: {
    fontSize: '14px',
    color: '#2d3748',
    margin: '5px 0'
  },
  orderItems: {
    fontSize: '14px',
    color: '#2d3748',
    marginBottom: '10px'
  },
  orderItemRow: {
    marginLeft: '15px',
    marginTop: '5px',
    color: '#718096'
  },
  orderNotes: {
    fontSize: '13px',
    color: '#718096',
    fontStyle: 'italic',
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '6px'
  },
  error: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  success: {
    backgroundColor: '#f0fdf4',
    color: '#10b981',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center'
  }
};

export default AdminDashboard;
