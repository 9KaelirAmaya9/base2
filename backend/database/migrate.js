/**
 * Database Migration Script
 * Runs schema migrations for the restaurant system
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...\n');

    // Read and execute base schema
    console.log('Running base schema (if needed)...');
    const baseSchema = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );
    await client.query(baseSchema);
    console.log('✓ Base schema applied');

    // Read and execute restaurant schema
    console.log('\nRunning restaurant schema...');
    const restaurantSchema = fs.readFileSync(
      path.join(__dirname, 'restaurant-schema.sql'),
      'utf8'
    );
    await client.query(restaurantSchema);
    console.log('✓ Restaurant schema applied');

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrate };
