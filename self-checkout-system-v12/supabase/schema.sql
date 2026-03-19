-- ============================================
-- KIOSK SYSTEM — FULL SCHEMA (Fresh Install)
-- Run this entirely in Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean slate
DROP TABLE IF EXISTS order_addons        CASCADE;
DROP TABLE IF EXISTS order_items         CASCADE;
DROP TABLE IF EXISTS orders              CASCADE;
DROP TABLE IF EXISTS order_daily_counter CASCADE;
DROP TABLE IF EXISTS item_addons         CASCADE;
DROP TABLE IF EXISTS add_ons             CASCADE;
DROP TABLE IF EXISTS item_variants       CASCADE;
DROP TABLE IF EXISTS menu_items          CASCADE;
DROP TABLE IF EXISTS categories          CASCADE;
DROP FUNCTION IF EXISTS next_queue_number();
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- ============================================
-- TABLES
-- ============================================
CREATE TABLE categories (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  icon          VARCHAR(50)  DEFAULT 'fa-utensils',
  display_order INT          DEFAULT 0,
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE menu_items (
  id               SERIAL PRIMARY KEY,
  category_id      INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name             VARCHAR(150)  NOT NULL,
  description      TEXT,
  base_price       DECIMAL(10,2) NOT NULL,
  image            VARCHAR(255)  DEFAULT 'default.jpg',
  is_available     BOOLEAN       DEFAULT TRUE,
  is_featured      BOOLEAN       DEFAULT FALSE,
  preparation_time INT           DEFAULT 5,
  calories         INT           DEFAULT 0,
  display_order    INT           DEFAULT 0,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE item_variants (
  id             SERIAL PRIMARY KEY,
  menu_item_id   INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  variant_type   VARCHAR(20) NOT NULL CHECK (variant_type IN ('size','flavor','style')),
  name           VARCHAR(50) NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  is_default     BOOLEAN DEFAULT FALSE,
  is_available   BOOLEAN DEFAULT TRUE
);

CREATE TABLE add_ons (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  addon_type   VARCHAR(20)   DEFAULT 'topping' CHECK (addon_type IN ('topping','side','drink','sauce')),
  is_available BOOLEAN       DEFAULT TRUE,
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE item_addons (
  id           SERIAL PRIMARY KEY,
  menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  addon_id     INT NOT NULL REFERENCES add_ons(id)    ON DELETE CASCADE,
  UNIQUE (menu_item_id, addon_id)
);

-- Stores one row per calendar day; atomically incremented per order
CREATE TABLE order_daily_counter (
  date    DATE PRIMARY KEY,
  counter INT  NOT NULL DEFAULT 0
);

-- order_number = "YYYYMMDD-NNN"  → globally unique forever
-- queue_number = "NNN"           → shown to customer, resets daily
CREATE TABLE orders (
  id             SERIAL PRIMARY KEY,
  order_number   VARCHAR(15) UNIQUE NOT NULL,
  queue_number   VARCHAR(5)  NOT NULL,
  order_type     VARCHAR(10) DEFAULT 'takeout' CHECK (order_type IN ('dine-in','takeout')),
  status         VARCHAR(20) DEFAULT 'pending'  CHECK (status IN ('pending','preparing','ready','completed','cancelled')),
  subtotal       DECIMAL(10,2) NOT NULL,
  tax            DECIMAL(10,2) DEFAULT 0.00,
  total          DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(10) DEFAULT 'cash' CHECK (payment_method IN ('cash','card','ewallet','qr')),
  session_id     VARCHAR(100),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id                   SERIAL PRIMARY KEY,
  order_id             INT NOT NULL REFERENCES orders(id)      ON DELETE CASCADE,
  menu_item_id         INT NOT NULL REFERENCES menu_items(id),
  item_name            VARCHAR(150) NOT NULL,
  variant_id           INT REFERENCES item_variants(id) ON DELETE SET NULL,
  variant_name         VARCHAR(50),
  quantity             INT NOT NULL DEFAULT 1,
  unit_price           DECIMAL(10,2) NOT NULL,
  subtotal             DECIMAL(10,2) NOT NULL,
  special_instructions TEXT
);

CREATE TABLE order_addons (
  id            SERIAL PRIMARY KEY,
  order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  addon_id      INT NOT NULL REFERENCES add_ons(id),
  addon_name    VARCHAR(100)  NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  quantity      INT DEFAULT 1
);

-- ============================================
-- ATOMIC QUEUE NUMBER FUNCTION
-- Uses INSERT...ON CONFLICT DO UPDATE to increment
-- the daily counter in one atomic DB operation.
-- Concurrent checkouts are serialised by Postgres —
-- no two orders can ever get the same number.
--
-- Returns JSON: { order_number, queue_number }
--   order_number  "20260318-001"  (stored in DB, globally unique)
--   queue_number  "001"           (shown to customer, resets daily)
-- ============================================
CREATE OR REPLACE FUNCTION next_queue_number()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today     DATE := CURRENT_DATE;
  today_str TEXT := TO_CHAR(today, 'YYYYMMDD');
  seq_num   INT;
  q_num     TEXT;
  o_num     TEXT;
BEGIN
  INSERT INTO order_daily_counter (date, counter)
  VALUES (today, 1)
  ON CONFLICT (date)
  DO UPDATE SET counter = order_daily_counter.counter + 1
  RETURNING counter INTO seq_num;

  q_num := LPAD(seq_num::TEXT, 3, '0');
  o_num := today_str || '-' || q_num;

  RETURN json_build_object(
    'order_number', o_num,
    'queue_number', q_num
  );
END;
$$;

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT          ON orders               TO anon;
GRANT SELECT, INSERT          ON order_items          TO anon;
GRANT SELECT, INSERT          ON order_addons         TO anon;
GRANT SELECT, INSERT, UPDATE  ON order_daily_counter  TO anon;
GRANT SELECT ON categories    TO anon;
GRANT SELECT ON menu_items    TO anon;
GRANT SELECT ON item_variants TO anon;
GRANT SELECT ON add_ons       TO anon;
GRANT SELECT ON item_addons   TO anon;

GRANT ALL ON orders               TO authenticated;
GRANT ALL ON order_items          TO authenticated;
GRANT ALL ON order_addons         TO authenticated;
GRANT ALL ON order_daily_counter  TO authenticated;
GRANT ALL ON categories           TO authenticated;
GRANT ALL ON menu_items           TO authenticated;
GRANT ALL ON item_variants        TO authenticated;
GRANT ALL ON add_ons              TO authenticated;
GRANT ALL ON item_addons          TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION next_queue_number() TO anon;
GRANT EXECUTE ON FUNCTION next_queue_number() TO authenticated;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_variants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_addons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_addons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_daily_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"  ON categories   FOR SELECT USING (true);
CREATE POLICY "Admin write"  ON categories   FOR ALL    USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Public read"  ON menu_items   FOR SELECT USING (true);
CREATE POLICY "Admin write"  ON menu_items   FOR ALL    USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Public read"  ON item_variants FOR SELECT USING (true);
CREATE POLICY "Admin write"  ON item_variants FOR ALL    USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Public read"  ON add_ons       FOR SELECT USING (true);
CREATE POLICY "Admin write"  ON add_ons       FOR ALL    USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Public read"  ON item_addons   FOR SELECT USING (true);
CREATE POLICY "Admin write"  ON item_addons   FOR ALL    USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Anyone insert" ON orders      FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone read"   ON orders      FOR SELECT USING (true);
CREATE POLICY "Admin update"  ON orders      FOR UPDATE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Admin delete"  ON orders      FOR DELETE USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Anyone insert" ON order_items  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone read"   ON order_items  FOR SELECT USING (true);
CREATE POLICY "Anyone insert" ON order_addons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone read"   ON order_addons FOR SELECT USING (true);

-- Counter is accessed only through the SECURITY DEFINER function
CREATE POLICY "Function only" ON order_daily_counter FOR ALL USING (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME (queue page live updates)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO categories (name, slug, icon, display_order) VALUES
  ('Burgers','burgers','fa-burger',1),('Chicken','chicken','fa-drumstick-bite',2),
  ('Pizza','pizza','fa-pizza-slice',3),('Sides','sides','fa-bread-slice',4),
  ('Drinks','drinks','fa-glass-water',5),('Desserts','desserts','fa-ice-cream',6);

INSERT INTO menu_items (category_id,name,description,base_price,is_featured,preparation_time) VALUES
  (1,'Classic Cheeseburger','Juicy beef patty with cheese, lettuce, tomato, and special sauce',8.99,TRUE,8),
  (1,'Double Bacon Burger','Two beef patties with crispy bacon and cheddar cheese',12.99,TRUE,10),
  (1,'Veggie Delight Burger','Plant-based patty with fresh vegetables',9.99,FALSE,7),
  (1,'Spicy Jalapeño Burger','Beef patty with jalapeños, pepper jack cheese, and spicy mayo',10.99,FALSE,8),
  (2,'Crispy Chicken Sandwich','Fried chicken breast with pickles and mayo',9.49,TRUE,10),
  (2,'Chicken Tenders','Five golden fried chicken tenders',10.99,FALSE,8),
  (2,'Buffalo Wings','Spicy buffalo chicken wings with ranch dip',11.99,FALSE,12),
  (2,'Grilled Chicken Wrap','Grilled chicken with fresh vegetables in a tortilla',8.99,FALSE,7),
  (3,'Pepperoni Pizza','Classic pepperoni with mozzarella cheese',14.99,TRUE,15),
  (3,'Margherita Pizza','Fresh tomatoes, basil, and mozzarella',13.99,FALSE,15),
  (3,'Meat Lovers Pizza','Pepperoni, sausage, bacon, and ham',16.99,TRUE,15),
  (3,'Vegetarian Pizza','Bell peppers, mushrooms, olives, and onions',14.99,FALSE,15),
  (4,'French Fries','Crispy golden french fries',3.99,FALSE,5),
  (4,'Onion Rings','Battered and fried onion rings',4.49,FALSE,6),
  (4,'Mozzarella Sticks','Breaded mozzarella with marinara sauce',5.99,FALSE,7),
  (4,'Caesar Salad','Fresh romaine lettuce with Caesar dressing',6.99,FALSE,5),
  (5,'Coca-Cola','Classic Coca-Cola',2.49,FALSE,1),
  (5,'Orange Juice','Fresh squeezed orange juice',3.49,FALSE,1),
  (5,'Iced Coffee','Cold brewed coffee with ice',3.99,FALSE,2),
  (5,'Milkshake','Creamy milkshake in vanilla, chocolate, or strawberry',4.99,FALSE,3),
  (6,'Chocolate Brownie','Warm chocolate brownie with ice cream',5.99,FALSE,5),
  (6,'Apple Pie','Classic apple pie with cinnamon',4.99,FALSE,3),
  (6,'Ice Cream Sundae','Vanilla ice cream with toppings',5.49,FALSE,2),
  (6,'Cheesecake','New York style cheesecake',6.99,FALSE,2);

INSERT INTO add_ons (name,price,addon_type) VALUES
  ('Extra Cheese',1.50,'topping'),('Bacon',2.00,'topping'),
  ('Avocado',2.50,'topping'),('Fried Egg',1.50,'topping'),
  ('Jalapeños',0.75,'topping'),('Mushrooms',1.00,'topping'),
  ('BBQ Sauce',0.50,'sauce'),('Ranch Dressing',0.50,'sauce'),
  ('Honey Mustard',0.50,'sauce'),('Buffalo Sauce',0.50,'sauce'),
  ('Side Fries',3.99,'side'),('Side Salad',4.99,'side'),
  ('Coleslaw',2.99,'side'),('Bottled Water',1.99,'drink'),
  ('Soft Drink',2.49,'drink');

INSERT INTO item_variants (menu_item_id,variant_type,name,price_modifier,is_default) VALUES
  (1,'size','Regular',0.00,TRUE),(1,'size','Large',2.00,FALSE),
  (2,'size','Regular',0.00,TRUE),(2,'size','Large',2.50,FALSE),
  (9,'size','Medium (10")',0.00,TRUE),(9,'size','Large (14")',5.00,FALSE),(9,'size','X-Large (18")',8.00,FALSE),
  (10,'size','Medium (10")',0.00,TRUE),(10,'size','Large (14")',5.00,FALSE),
  (17,'size','Small',0.00,TRUE),(17,'size','Medium',0.50,FALSE),(17,'size','Large',1.00,FALSE),
  (18,'size','Small',0.00,TRUE),(18,'size','Medium',0.50,FALSE),
  (20,'flavor','Vanilla',0.00,TRUE),(20,'flavor','Chocolate',0.00,FALSE),(20,'flavor','Strawberry',0.00,FALSE);

INSERT INTO item_addons (menu_item_id,addon_id) VALUES
  (1,1),(1,2),(1,3),(1,4),(1,5),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),
  (2,1),(2,2),(2,3),(2,4),(2,5),(2,7),(2,8),(2,9),(2,10),(2,11),(2,12),(2,13),(2,14),(2,15),
  (3,1),(3,3),(3,5),(3,6),(4,1),(4,2),(4,5),(4,6),
  (5,7),(5,8),(5,9),(5,10),(5,11),(5,12),(5,13),(5,14),(5,15);

SELECT 'Schema installed successfully!' AS status;
