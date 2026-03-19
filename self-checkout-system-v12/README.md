# Self Checkout System — Vite + React + Supabase

A modern self-checkout kiosk system converted from PHP/MySQL to Vite/React with Supabase backend.

---

## 🗂 Project Structure

```
kiosk-system/
├── public/
│   ├── logo.png                  # Your restaurant logo
│   └── images/menu/              # Menu item images (copy from original /assets/images/menu/)
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminSidebar.jsx
│   │   ├── kiosk/
│   │   │   ├── CartPanel.jsx
│   │   │   ├── ItemModal.jsx
│   │   │   └── MenuGrid.jsx
│   │   └── shared/
│   │       ├── KioskHeader.jsx
│   │       ├── NotificationProvider.jsx
│   │       ├── ProtectedRoute.jsx
│   │       └── StatusBadge.jsx
│   ├── context/
│   │   ├── AuthContext.jsx       # Supabase auth
│   │   └── CartContext.jsx       # Cart state
│   ├── lib/
│   │   └── supabase.js           # Supabase client
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminCategories.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminMenu.jsx
│   │   │   └── AdminOrders.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── ConfirmationPage.jsx
│   │   ├── KioskPage.jsx
│   │   └── QueuePage.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── supabase/
│   └── schema.sql                # Run this in Supabase SQL editor
├── .env.example
├── index.html
├── package.json
└── vite.config.js

```

## 🗺 Routes

| Path                | Description                      |
| ------------------- | -------------------------------- |
| `/`                 | Kiosk — browse menu, add to cart |
| `/checkout`         | Payment & order type selection   |
| `/confirmation`     | Order success with order number  |
| `/queue`            | Real-time order queue display    |
| `/admin/login`      | Admin sign in (Supabase Auth)    |
| `/admin`            | Dashboard with stats             |
| `/admin/orders`     | Order management (update status) |
| `/admin/menu`       | Menu item CRUD                   |
| `/admin/categories` | Category CRUD                    |

---

## 🔐 Authentication

Admin authentication uses **Supabase Auth** (email/password). Row Level Security (RLS) policies ensure:

- Public: can read categories, menu items, and create orders
- Authenticated (admin): full CRUD on all tables

---

## 🔄 Realtime

The Queue page (`/queue`) uses **Supabase Realtime** to automatically reflect order status changes without manual refresh. To enable:

1. In Supabase dashboard, go to **Database → Replication**
2. Enable replication for the `orders` table

A polling fallback (every 8 seconds) is included automatically.

---

## 🧱 Tech Stack

| Layer        | Technology                         |
| ------------ | ---------------------------------- |
| Frontend     | React 18 + Vite                    |
| Routing      | React Router v6                    |
| Backend / DB | Supabase (PostgreSQL)              |
| Auth         | Supabase Auth                      |
| Realtime     | Supabase Realtime                  |
| Styling      | Vanilla CSS (glassmorphism design) |
| Fonts        | Space Grotesk + DM Sans            |
| Icons        | Font Awesome 6                     |
