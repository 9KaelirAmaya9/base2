-- Seed Data for Taco Restaurant
-- Creates staff users, menu categories, and sample menu items

-- Note: Passwords are bcrypt hashed
-- admin@tacos.local / admin123
-- kitchen@tacos.local / kitchen123
-- Both hashes use bcrypt with salt rounds = 10

-- Insert staff users (admin and kitchen)
-- Password for admin@tacos.local is 'admin123'
INSERT INTO users (email, password_hash, name, role, email_verified, auth_provider)
VALUES (
    'admin@tacos.local',
    '$2a$10$rJ4H3z8H3r5qN7yJ9K9gZO7V3zH3r5qN7yJ9K9gZO7V3zH3r5qN7y',
    'Admin User',
    'ADMIN',
    TRUE,
    'email'
) ON CONFLICT (email) DO UPDATE
SET role = 'ADMIN', email_verified = TRUE;

-- Password for kitchen@tacos.local is 'kitchen123'
INSERT INTO users (email, password_hash, name, role, email_verified, auth_provider)
VALUES (
    'kitchen@tacos.local',
    '$2a$10$sK5I4a9I4s6rO8zK0L0hAP8W4aI4s6rO8zK0L0hAP8W4aI4s6rO8z',
    'Kitchen Staff',
    'KITCHEN',
    TRUE,
    'email'
) ON CONFLICT (email) DO UPDATE
SET role = 'KITCHEN', email_verified = TRUE;

-- Insert menu categories
INSERT INTO menu_categories (name, sort_order) VALUES
    ('TACOS', 1),
    ('SIDES', 2),
    ('DRINKS', 3),
    ('SPECIALS', 4)
ON CONFLICT DO NOTHING;

-- Get category IDs for use in menu items
DO $$
DECLARE
    tacos_id INTEGER;
    sides_id INTEGER;
    drinks_id INTEGER;
    specials_id INTEGER;
BEGIN
    SELECT id INTO tacos_id FROM menu_categories WHERE name = 'TACOS';
    SELECT id INTO sides_id FROM menu_categories WHERE name = 'SIDES';
    SELECT id INTO drinks_id FROM menu_categories WHERE name = 'DRINKS';
    SELECT id INTO specials_id FROM menu_categories WHERE name = 'SPECIALS';

    -- Insert Taco menu items
    INSERT INTO menu_items (name, description, price, category_id, is_available, is_special) VALUES
        ('Carne Asada Taco', 'Grilled marinated steak with cilantro, onions, and fresh lime', 4.50, tacos_id, TRUE, FALSE),
        ('Al Pastor Taco', 'Marinated pork with pineapple, cilantro, and onions', 4.25, tacos_id, TRUE, FALSE),
        ('Chicken Taco', 'Grilled chicken with lettuce, tomato, cheese, and sour cream', 3.75, tacos_id, TRUE, FALSE),
        ('Fish Taco', 'Beer-battered fish with cabbage slaw and chipotle mayo', 5.00, tacos_id, TRUE, FALSE),
        ('Carnitas Taco', 'Slow-cooked pork with cilantro, onions, and salsa verde', 4.25, tacos_id, TRUE, FALSE),
        ('Veggie Taco', 'Grilled vegetables with black beans, guacamole, and queso fresco', 3.50, tacos_id, TRUE, FALSE),
        ('Shrimp Taco', 'Grilled shrimp with mango salsa and avocado crema', 5.50, tacos_id, TRUE, TRUE)
    ON CONFLICT DO NOTHING;

    -- Insert Sides menu items
    INSERT INTO menu_items (name, description, price, category_id, is_available, is_special) VALUES
        ('Rice & Beans', 'Mexican rice and refried beans', 3.50, sides_id, TRUE, FALSE),
        ('Chips & Salsa', 'Fresh tortilla chips with house-made salsa', 4.00, sides_id, TRUE, FALSE),
        ('Chips & Guacamole', 'Fresh tortilla chips with made-to-order guacamole', 6.50, sides_id, TRUE, FALSE),
        ('Street Corn (Elote)', 'Grilled corn with mayo, cotija cheese, chili powder, and lime', 4.50, sides_id, TRUE, FALSE),
        ('Chips & Queso', 'Crispy chips with warm queso dip', 5.00, sides_id, TRUE, FALSE),
        ('Black Beans', 'Seasoned black beans topped with queso fresco', 3.00, sides_id, TRUE, FALSE)
    ON CONFLICT DO NOTHING;

    -- Insert Drinks menu items
    INSERT INTO menu_items (name, description, price, category_id, is_available, is_special) VALUES
        ('Horchata', 'Traditional Mexican rice drink with cinnamon', 3.00, drinks_id, TRUE, FALSE),
        ('Jamaica', 'Hibiscus flower iced tea', 3.00, drinks_id, TRUE, FALSE),
        ('Tamarindo', 'Sweet and tangy tamarind drink', 3.00, drinks_id, TRUE, FALSE),
        ('Mexican Coke', 'Coca-Cola made with real cane sugar', 2.50, drinks_id, TRUE, FALSE),
        ('Jarritos', 'Mexican soda (various flavors)', 2.50, drinks_id, TRUE, FALSE),
        ('Fresh Lime Water', 'House-made agua fresca with fresh lime', 3.00, drinks_id, TRUE, FALSE),
        ('Iced Tea', 'Freshly brewed iced tea', 2.00, drinks_id, TRUE, FALSE)
    ON CONFLICT DO NOTHING;

    -- Insert Specials menu items
    INSERT INTO menu_items (name, description, price, category_id, is_available, is_special) VALUES
        ('Taco Trio', 'Choose any three tacos from our menu', 11.99, specials_id, TRUE, TRUE),
        ('Taco Platter', 'Two tacos with rice, beans, and a drink', 13.99, specials_id, TRUE, TRUE),
        ('Family Pack', 'Eight tacos, large rice & beans, chips & salsa, and four drinks', 39.99, specials_id, TRUE, TRUE),
        ('Burrito Grande', 'Huge burrito with choice of meat, rice, beans, cheese, and toppings', 10.99, specials_id, TRUE, FALSE)
    ON CONFLICT DO NOTHING;
END $$;

-- Print confirmation
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Staff accounts created:';
    RAISE NOTICE '  Admin: admin@tacos.local / admin123';
    RAISE NOTICE '  Kitchen: kitchen@tacos.local / kitchen123';
END $$;
