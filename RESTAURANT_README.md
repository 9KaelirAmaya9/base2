# 🌮 Base2 Taco Restaurant Platform

A fully functional taco restaurant website built on the Base 2 authentication system, featuring online ordering, role-based dashboards, and real-time kitchen order management.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

This is a complete restaurant management platform that extends the Base 2 authentication system with:

- **Public-facing website** for browsing menu and placing orders
- **Admin dashboard** for managing menu items and orders
- **Kitchen dashboard** for real-time order tracking
- **Role-based access control** (Admin, Kitchen Staff, Customers)
- **Full order lifecycle** from placement to completion

---

## ✨ Features

### Customer Features
- Browse categorized menu (Tacos, Sides, Drinks, Specials)
- Add items to cart with quantity control
- Place pickup orders with contact info
- View order confirmation and status updates
- Check location and hours

### Admin Features
- Full menu management (Create, Read, Update, Delete items)
- Manage menu categories
- View all orders with filtering
- Update order statuses
- View customer information and order details

### Kitchen Features
- Real-time view of active orders (NEW and IN_PROGRESS)
- Visual urgency indicators for old orders
- Quick status updates (Start Preparing, Mark Ready)
- Order details with special instructions
- Auto-refresh every 5 seconds

---

## 🛠 Tech Stack

### Frontend
- **React 18.2** - UI framework
- **React Router v6** - Client-side routing
- **Context API** - State management (Auth, Cart)
- **Axios** - HTTP client
- **Inline CSS-in-JS** - Styling

### Backend
- **Express.js** - Web server framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **pg** - PostgreSQL driver

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Web server
- **Traefik** - Reverse proxy

---

## 🚀 Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

### 1. Clone and Navigate

```bash
cd /home/user/base2
```

### 2. Environment Configuration

The project uses the existing `.env` files. No changes needed unless you want to customize:

- `backend/.env` - Backend configuration
- `react-app/.env` - Frontend configuration

### 3. Database Setup

Run migrations and seed data:

```bash
# Navigate to backend
cd backend

# Install dependencies (if not already done)
npm install

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

This will create:
- ✅ Restaurant database tables (menu_categories, menu_items, orders, order_items)
- ✅ Admin user: `admin@tacos.local` / `admin123`
- ✅ Kitchen user: `kitchen@tacos.local` / `kitchen123`
- ✅ Sample menu with 25+ items across 4 categories

### 4. Start the Application

#### Option A: Using Docker (Recommended)

```bash
# From project root
./scripts/start.sh

# Or using docker-compose directly
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

#### Option B: Local Development

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd react-app
npm install
npm start
```

### 5. Verify Installation

1. Visit http://localhost:3000
2. Click "View Menu" to see the restaurant menu
3. Try placing a test order
4. Login as admin: `admin@tacos.local` / `admin123`
5. Navigate to Admin Dashboard to manage menu and orders
6. Login as kitchen staff: `kitchen@tacos.local` / `kitchen123`
7. Navigate to Kitchen Dashboard to see active orders

---

## 📖 Usage Guide

### For Customers (No Login Required)

1. **Browse Menu**
   - Go to http://localhost:3000/menu
   - Filter by category or view all items
   - Click "Add to Cart" for desired items

2. **Place Order**
   - Click the floating "Cart" button
   - Adjust quantities or remove items
   - Fill in contact information
   - Click "Place Order"
   - Save the Order # from confirmation page

3. **Check Status**
   - Use the confirmation link to check order status
   - Status updates automatically: NEW → IN_PROGRESS → READY

### For Admin Users

**Login:** `admin@tacos.local` / `admin123`

1. **Manage Menu**
   - Navigate to Admin Dashboard
   - Click "Menu Management" tab
   - Add new items with the "+ Add Menu Item" button
   - Edit existing items by clicking "Edit"
   - Delete items (will prompt for confirmation)
   - Toggle availability and special status

2. **Manage Orders**
   - Click "Order Management" tab
   - View all orders with full details
   - Update order status via dropdown
   - See customer information and notes

### For Kitchen Staff

**Login:** `kitchen@tacos.local` / `kitchen123`

1. **View Active Orders**
   - Navigate to Kitchen Dashboard
   - See NEW orders (blue background)
   - See IN_PROGRESS orders (yellow background)
   - Urgent orders (>15 min old) have red border

2. **Update Orders**
   - Click "▶️ Start Preparing" to begin working on order
   - Click "✅ Mark Ready" when order is complete
   - Dashboard auto-refreshes every 5 seconds

---

## 🔌 API Documentation

### Public Endpoints

**Menu**
- `GET /api/menu` - Get full menu with categories
- `GET /api/menu/items` - Get all menu items
- `GET /api/menu/items/:id` - Get single item

**Orders**
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID

### Protected Endpoints (Admin)

**Menu Management**
- `POST /api/menu/items` - Create menu item
- `PUT /api/menu/items/:id` - Update menu item
- `DELETE /api/menu/items/:id` - Delete menu item
- `POST /api/menu/categories` - Create category
- `PUT /api/menu/categories/:id` - Update category

**Order Management**
- `GET /api/orders` - Get all orders (with filters)
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Protected Endpoints (Kitchen + Admin)

- `GET /api/orders/list/active` - Get active orders
- `PATCH /api/orders/:id/status` - Update order status

### Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 📁 Project Structure

```
base2/
├── backend/
│   ├── config/
│   │   └── database.js              # PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── menuController.js        # Menu CRUD operations
│   │   └── orderController.js       # Order management
│   ├── database/
│   │   ├── schema.sql               # Base auth schema
│   │   ├── restaurant-schema.sql    # Restaurant tables
│   │   ├── migrate.js               # Migration runner
│   │   └── seed.js                  # Seed data script
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   └── roles.js                 # Role-based access
│   ├── routes/
│   │   ├── auth.js                  # Auth routes
│   │   ├── menu.js                  # Menu routes
│   │   └── orders.js                # Order routes
│   └── server.js                    # Express server
│
├── react-app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.js        # Nav bar with cart + role links
│   │   │   └── ProtectedRoute.js    # Route guard
│   │   ├── contexts/
│   │   │   ├── AuthContext.js       # Auth state management
│   │   │   └── CartContext.js       # Shopping cart state
│   │   ├── pages/
│   │   │   ├── Home.js              # Landing / Login
│   │   │   ├── Menu.js              # Public menu page
│   │   │   ├── Cart.js              # Cart + Checkout
│   │   │   ├── OrderConfirmation.js # Order status page
│   │   │   ├── Location.js          # Location & hours
│   │   │   ├── AdminDashboard.js    # Admin menu + order mgmt
│   │   │   ├── KitchenDashboard.js  # Kitchen order tracking
│   │   │   ├── Dashboard.js         # User dashboard
│   │   │   └── UserSettings.js      # Profile settings
│   │   ├── services/
│   │   │   └── api.js               # Axios instance
│   │   └── App.js                   # Main app + routing
│   └── package.json
│
├── scripts/                         # Docker management scripts
├── docker-compose.yml               # Container orchestration
└── RESTAURANT_README.md             # This file
```

---

## 🎨 Design Decisions

### Role-Based Access
- **ADMIN** - Full access to menu and order management
- **KITCHEN** - Access to active orders and status updates
- **CUSTOMER** - Public access to menu and ordering (no account required)

### Order Flow
1. Customer places order (no login required)
2. Order created with status: NEW
3. Kitchen staff sees order immediately
4. Kitchen updates: NEW → IN_PROGRESS → READY
5. Customer can check status via confirmation link

### Cart Persistence
- Cart stored in localStorage
- Persists across page reloads
- Cleared after successful order

### Menu Organization
- Four categories: TACOS, SIDES, DRINKS, SPECIALS
- Items can be marked as "Special" for highlighting
- Availability toggle for sold-out items

---

## 🚧 Future Enhancements

### High Priority
1. **Stripe Integration** - Real payment processing
2. **Order Notifications** - SMS/Email notifications for customers
3. **User Accounts** - Customer login for order history
4. **Real-time Updates** - WebSocket for live order updates

### Medium Priority
5. **Delivery** - Add delivery option with address input
6. **Scheduled Orders** - Allow ordering for future pickup time
7. **Order History** - Customer order tracking and reordering
8. **Analytics** - Sales reports and popular items
9. **Inventory** - Track ingredients and auto-disable items

### Nice to Have
10. **Loyalty Program** - Points and rewards
11. **Reviews** - Customer ratings and feedback
12. **Catering** - Large order management
13. **Multi-location** - Support for multiple restaurants
14. **Mobile App** - React Native version

---

## 🧪 Testing

### Manual Test Scenarios

**Customer Flow:**
1. Browse menu → Add items → Checkout → Place order → View confirmation

**Admin Flow:**
1. Login → Create new menu item → Edit item → Delete item
2. View orders → Update status → Filter orders

**Kitchen Flow:**
1. Login → View active orders → Start order → Mark ready
2. Check auto-refresh → Verify urgency indicators

**Integration Test:**
1. Place order as customer
2. See order appear in kitchen dashboard
3. Update status in kitchen
4. Verify status updates on customer confirmation page
5. Complete order in admin dashboard

---

## 📞 Support

For issues or questions:
1. Check the [Project Issues](https://github.com/anthropics/claude-code/issues)
2. Review API logs: `docker-compose logs backend`
3. Check browser console for frontend errors

---

## 📄 License

This project is built on the Base 2 authentication template.

---

## 🙏 Acknowledgments

- Built with Claude Code
- Based on Base 2 authentication template
- PostgreSQL for reliable data storage
- React for dynamic UI

---

**Enjoy building your taco empire! 🌮🚀**
