/**
 * Database Seed Script for Taco Restaurant
 * Creates staff users and sample menu data
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Starting database seed...\n');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const kitchenPasswordHash = await bcrypt.hash('kitchen123', 10);

    // Start transaction
    await client.query('BEGIN');

    // 1. Insert staff users
    console.log('Creating staff users...');
    await client.query(`
      INSERT INTO users (email, password_hash, name, role, email_verified, auth_provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email)
      DO UPDATE SET
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        password_hash = EXCLUDED.password_hash
    `, ['admin@tacos.local', adminPasswordHash, 'Admin User', 'ADMIN', true, 'email']);

    await client.query(`
      INSERT INTO users (email, password_hash, name, role, email_verified, auth_provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email)
      DO UPDATE SET
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        password_hash = EXCLUDED.password_hash
    `, ['kitchen@tacos.local', kitchenPasswordHash, 'Kitchen Staff', 'KITCHEN', true, 'email']);

    console.log('✓ Staff users created');

    // 2. Insert menu categories
    console.log('\nCreating menu categories...');
    const categories = [
      { name: 'TACOS', sort_order: 1 },
      { name: 'SIDES', sort_order: 2 },
      { name: 'DRINKS', sort_order: 3 },
      { name: 'SPECIALS', sort_order: 4 }
    ];

    for (const category of categories) {
      await client.query(`
        INSERT INTO menu_categories (name, sort_order)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [category.name, category.sort_order]);
    }
    console.log('✓ Menu categories created');

    // 3. Get category IDs
    const categoryIds = {};
    for (const category of categories) {
      const result = await client.query(
        'SELECT id FROM menu_categories WHERE name = $1',
        [category.name]
      );
      categoryIds[category.name] = result.rows[0].id;
    }

    // 4. Insert menu items
    console.log('\nCreating menu items...');

    const menuItems = [
      // Tacos
      {
        name: 'Carne Asada Taco',
        description: 'Grilled marinated steak with cilantro, onions, and fresh lime',
        price: 4.50,
        category: 'TACOS',
        is_special: false
      },
      {
        name: 'Al Pastor Taco',
        description: 'Marinated pork with pineapple, cilantro, and onions',
        price: 4.25,
        category: 'TACOS',
        is_special: false
      },
      {
        name: 'Chicken Taco',
        description: 'Grilled chicken with lettuce, tomato, cheese, and sour cream',
        price: 3.75,
        category: 'TACOS',
        is_special: false
      },
      {
        name: 'Fish Taco',
        description: 'Beer-battered fish with cabbage slaw and chipotle mayo',
        price: 5.00,
        category: 'TACOS',
        is_special: false
      },
      {
        name: 'Carnitas Taco',
        description: 'Slow-cooked pork with cilantro, onions, and salsa verde',
        price: 4.25,
        category: 'TACOS',
        is_special: false
      },
      {
        name: 'Veggie Taco',
        description: 'Grilled vegetables with black beans, guacamole, and queso fresco',
        price: 3.50,
        category: 'TACOS',
        is_special: false
      },
      {
        name: 'Shrimp Taco',
        description: 'Grilled shrimp with mango salsa and avocado crema',
        price: 5.50,
        category: 'TACOS',
        is_special: true
      },
      // Sides
      {
        name: 'Rice & Beans',
        description: 'Mexican rice and refried beans',
        price: 3.50,
        category: 'SIDES',
        is_special: false
      },
      {
        name: 'Chips & Salsa',
        description: 'Fresh tortilla chips with house-made salsa',
        price: 4.00,
        category: 'SIDES',
        is_special: false
      },
      {
        name: 'Chips & Guacamole',
        description: 'Fresh tortilla chips with made-to-order guacamole',
        price: 6.50,
        category: 'SIDES',
        is_special: false
      },
      {
        name: 'Street Corn (Elote)',
        description: 'Grilled corn with mayo, cotija cheese, chili powder, and lime',
        price: 4.50,
        category: 'SIDES',
        is_special: false
      },
      {
        name: 'Chips & Queso',
        description: 'Crispy chips with warm queso dip',
        price: 5.00,
        category: 'SIDES',
        is_special: false
      },
      {
        name: 'Black Beans',
        description: 'Seasoned black beans topped with queso fresco',
        price: 3.00,
        category: 'SIDES',
        is_special: false
      },
      // Drinks
      {
        name: 'Horchata',
        description: 'Traditional Mexican rice drink with cinnamon',
        price: 3.00,
        category: 'DRINKS',
        is_special: false
      },
      {
        name: 'Jamaica',
        description: 'Hibiscus flower iced tea',
        price: 3.00,
        category: 'DRINKS',
        is_special: false
      },
      {
        name: 'Tamarindo',
        description: 'Sweet and tangy tamarind drink',
        price: 3.00,
        category: 'DRINKS',
        is_special: false
      },
      {
        name: 'Mexican Coke',
        description: 'Coca-Cola made with real cane sugar',
        price: 2.50,
        category: 'DRINKS',
        is_special: false
      },
      {
        name: 'Jarritos',
        description: 'Mexican soda (various flavors)',
        price: 2.50,
        category: 'DRINKS',
        is_special: false
      },
      {
        name: 'Fresh Lime Water',
        description: 'House-made agua fresca with fresh lime',
        price: 3.00,
        category: 'DRINKS',
        is_special: false
      },
      {
        name: 'Iced Tea',
        description: 'Freshly brewed iced tea',
        price: 2.00,
        category: 'DRINKS',
        is_special: false
      },
      // Specials
      {
        name: 'Taco Trio',
        description: 'Choose any three tacos from our menu',
        price: 11.99,
        category: 'SPECIALS',
        is_special: true
      },
      {
        name: 'Taco Platter',
        description: 'Two tacos with rice, beans, and a drink',
        price: 13.99,
        category: 'SPECIALS',
        is_special: true
      },
      {
        name: 'Family Pack',
        description: 'Eight tacos, large rice & beans, chips & salsa, and four drinks',
        price: 39.99,
        category: 'SPECIALS',
        is_special: true
      },
      {
        name: 'Burrito Grande',
        description: 'Huge burrito with choice of meat, rice, beans, cheese, and toppings',
        price: 10.99,
        category: 'SPECIALS',
        is_special: false
      }
    ];

    for (const item of menuItems) {
      await client.query(`
        INSERT INTO menu_items (name, description, price, category_id, is_available, is_special)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
        item.name,
        item.description,
        item.price,
        categoryIds[item.category],
        true,
        item.is_special
      ]);
    }
    console.log(`✓ ${menuItems.length} menu items created`);

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ Database seed completed successfully!\n');
    console.log('Staff Accounts:');
    console.log('  Admin:   admin@tacos.local / admin123');
    console.log('  Kitchen: kitchen@tacos.local / kitchen123\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seed };
