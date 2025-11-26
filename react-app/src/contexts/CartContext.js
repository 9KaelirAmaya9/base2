import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Load cart from localStorage on init
    const savedCart = localStorage.getItem('tacoCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tacoCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item, quantity = 1, customizations = '') => {
    setCartItems(prevItems => {
      // Check if item already exists with same customizations
      const existingItemIndex = prevItems.findIndex(
        cartItem =>
          cartItem.id === item.id &&
          cartItem.customizations === customizations
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [
          ...prevItems,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity,
            customizations,
            category_name: item.category_name
          }
        ];
      }
    });
  };

  const removeFromCart = (itemId, customizations = '') => {
    setCartItems(prevItems =>
      prevItems.filter(
        item => !(item.id === itemId && item.customizations === customizations)
      )
    );
  };

  const updateQuantity = (itemId, customizations, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, customizations);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId && item.customizations === customizations
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0
    );
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
