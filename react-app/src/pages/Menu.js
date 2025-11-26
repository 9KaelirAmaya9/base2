import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const Menu = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [addedItems, setAddedItems] = useState({});

  const { addToCart, getCartItemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await api.get('/menu', {
        params: { available_only: 'true' }
      });
      setMenu(response.data.data);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    addToCart(item, 1);

    // Show feedback
    setAddedItems(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
    }, 1000);
  };

  const filteredMenu = selectedCategory === 'ALL'
    ? menu
    : menu.filter(category => category.name === selectedCategory);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🌮 Our Menu</h1>
        <p style={styles.subtitle}>Fresh, authentic tacos made to order</p>
      </div>

      {/* Category Filter */}
      <div style={styles.categoryFilter}>
        <button
          onClick={() => setSelectedCategory('ALL')}
          style={{
            ...styles.categoryButton,
            ...(selectedCategory === 'ALL' ? styles.categoryButtonActive : {})
          }}
        >
          All
        </button>
        {menu.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.name)}
            style={{
              ...styles.categoryButton,
              ...(selectedCategory === category.name ? styles.categoryButtonActive : {})
            }}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Menu Categories */}
      {filteredMenu.map(category => (
        <div key={category.id} style={styles.category}>
          <h2 style={styles.categoryTitle}>{category.name}</h2>
          <div style={styles.itemsGrid}>
            {category.items.map(item => (
              <div key={item.id} style={styles.menuItem}>
                <div style={styles.itemHeader}>
                  <div>
                    <h3 style={styles.itemName}>
                      {item.name}
                      {item.is_special && (
                        <span style={styles.specialBadge}>⭐ Special</span>
                      )}
                    </h3>
                    <p style={styles.itemDescription}>{item.description}</p>
                  </div>
                  <div style={styles.itemPrice}>${parseFloat(item.price).toFixed(2)}</div>
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  style={{
                    ...styles.addButton,
                    ...(addedItems[item.id] ? styles.addButtonAdded : {})
                  }}
                >
                  {addedItems[item.id] ? '✓ Added!' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Floating Cart Button */}
      {getCartItemCount() > 0 && (
        <button
          onClick={() => navigate('/cart')}
          style={styles.floatingCart}
        >
          🛒 Cart ({getCartItemCount()})
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    paddingBottom: '100px'
  },
  header: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '60px 20px',
    textAlign: 'center'
  },
  title: {
    fontSize: '48px',
    margin: '0 0 10px 0',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: '18px',
    margin: 0,
    opacity: 0.9
  },
  categoryFilter: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    overflowX: 'auto'
  },
  categoryButton: {
    padding: '10px 20px',
    border: '2px solid #667eea',
    borderRadius: '25px',
    backgroundColor: 'white',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  categoryButtonActive: {
    backgroundColor: '#667eea',
    color: 'white'
  },
  category: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px'
  },
  categoryTitle: {
    fontSize: '32px',
    color: '#2d3748',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  menuItem: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  itemHeader: {
    marginBottom: '15px'
  },
  itemName: {
    fontSize: '20px',
    color: '#2d3748',
    margin: '0 0 8px 0',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  specialBadge: {
    fontSize: '12px',
    backgroundColor: '#fbbf24',
    color: '#78350f',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: '600'
  },
  itemDescription: {
    fontSize: '14px',
    color: '#718096',
    margin: '0 0 10px 0',
    lineHeight: '1.5'
  },
  itemPrice: {
    fontSize: '24px',
    color: '#667eea',
    fontWeight: 'bold'
  },
  addButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  addButtonAdded: {
    backgroundColor: '#48bb78'
  },
  floatingCart: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    padding: '15px 30px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
    transition: 'transform 0.2s ease',
    zIndex: 1000
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
    margin: '20px',
    borderRadius: '8px'
  }
};

export default Menu;
