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
