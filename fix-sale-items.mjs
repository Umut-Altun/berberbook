import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });

async function fixSaleItemsTable() {
  console.log("Starting database schema fix...");
  
  // Create a connection to the database
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  try {
    // Check if the sale_items table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sale_items'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log("Creating sale_items table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
          item_id INTEGER,
          item_type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Sale_items table created successfully");
    } else {
      // Check if the required columns exist
      console.log("Checking sale_items table structure...");
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items'
      `);
      
      const columns = columnsResult.rows.map(row => row.column_name);
      
      // Add missing columns if needed
      if (!columns.includes('item_id')) {
        console.log("Adding item_id column...");
        await pool.query("ALTER TABLE sale_items ADD COLUMN item_id INTEGER");
      }
      
      if (!columns.includes('item_type')) {
        console.log("Adding item_type column...");
        await pool.query("ALTER TABLE sale_items ADD COLUMN item_type VARCHAR(50) NOT NULL DEFAULT 'product'");
      }
      
      if (!columns.includes('name')) {
        console.log("Adding name column...");
        await pool.query("ALTER TABLE sale_items ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Unknown Product'");
      }
      
      if (!columns.includes('quantity')) {
        console.log("Adding quantity column...");
        await pool.query("ALTER TABLE sale_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1");
      }
      
      // Optional: Remove deprecated columns
      if (columns.includes('service_id')) {
        console.log("Removing service_id column...");
        await pool.query("ALTER TABLE sale_items DROP COLUMN service_id");
      }
      
      console.log("Sale_items table structure updated successfully");
    }
    
    console.log("Database schema fix completed successfully");
  } catch (error) {
    console.error("Error fixing database schema:", error);
  } finally {
    await pool.end();
  }
}

// Run the function
fixSaleItemsTable()
  .then(() => console.log("Script completed"))
  .catch(err => console.error("Script failed:", err)); 