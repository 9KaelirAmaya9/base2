import React from 'react';

const Location = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📍 Location & Hours</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.infoCard}>
          <h2 style={styles.cardTitle}>Find Us</h2>
          <div style={styles.address}>
            <p style={styles.addressLine}>🌮 Base 2 Tacos</p>
            <p style={styles.addressLine}>123 Taco Street</p>
            <p style={styles.addressLine}>Flavor Town, CA 90210</p>
          </div>

          <div style={styles.contact}>
            <p style={styles.contactLine}>📱 Phone: (555) TACO-123</p>
            <p style={styles.contactLine}>📧 Email: hello@base2tacos.com</p>
          </div>
        </div>

        <div style={styles.hoursCard}>
          <h2 style={styles.cardTitle}>Hours of Operation</h2>
          <div style={styles.hoursGrid}>
            <div style={styles.dayRow}>
              <span style={styles.day}>Monday - Friday</span>
              <span style={styles.hours}>11:00 AM - 9:00 PM</span>
            </div>
            <div style={styles.dayRow}>
              <span style={styles.day}>Saturday</span>
              <span style={styles.hours}>10:00 AM - 10:00 PM</span>
            </div>
            <div style={styles.dayRow}>
              <span style={styles.day}>Sunday</span>
              <span style={styles.hours}>10:00 AM - 8:00 PM</span>
            </div>
          </div>
        </div>

        <div style={styles.mapPlaceholder}>
          <div style={styles.mapText}>
            📍 Map would go here
            <br />
            <small>(Google Maps integration can be added)</small>
          </div>
        </div>

        <div style={styles.callToAction}>
          <h2 style={styles.ctaTitle}>Ready to Order?</h2>
          <p style={styles.ctaText}>
            Visit our menu and place an order for pickup!
          </p>
          <a href="/menu" style={styles.ctaButton}>
            View Menu
          </a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa'
  },
  header: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '60px 20px',
    textAlign: 'center'
  },
  title: {
    fontSize: '48px',
    margin: 0,
    fontWeight: 'bold'
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  hoursCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: '24px',
    color: '#2d3748',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  address: {
    marginBottom: '25px'
  },
  addressLine: {
    fontSize: '18px',
    color: '#2d3748',
    margin: '8px 0',
    lineHeight: '1.6'
  },
  contact: {
    paddingTop: '20px',
    borderTop: '2px solid #e2e8f0'
  },
  contactLine: {
    fontSize: '16px',
    color: '#4a5568',
    margin: '8px 0'
  },
  hoursGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  dayRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px'
  },
  day: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3748'
  },
  hours: {
    fontSize: '16px',
    color: '#667eea',
    fontWeight: '600'
  },
  mapPlaceholder: {
    backgroundColor: '#e2e8f0',
    borderRadius: '12px',
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  mapText: {
    fontSize: '18px',
    color: '#718096',
    textAlign: 'center'
  },
  callToAction: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  ctaTitle: {
    fontSize: '28px',
    color: '#2d3748',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  ctaText: {
    fontSize: '16px',
    color: '#718096',
    marginBottom: '25px'
  },
  ctaButton: {
    display: 'inline-block',
    padding: '15px 40px',
    backgroundColor: '#667eea',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'transform 0.2s ease'
  }
};

export default Location;
