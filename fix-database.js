// Script to fix database schema issues
const { ensureDatabaseConnection, query } = require("./lib/db");

async function fixDatabase() {
  console.log("Starting database schema fix...");
  
  try {
    // Ensure database connection
    await ensureDatabaseConnection();
    
    // Check if sale_items table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sale_items'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log("Creating sale_items table...");
      await query(`
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
      console.log("sale_items table created successfully");
    } else {
      // Check if item_id column exists in sale_items table
      console.log("Checking sale_items table structure...");
      
      const columnsResult = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items'
      `);
      
      const columns = columnsResult.rows.map(row => row.column_name);
      console.log("Existing columns:", columns);
      
      // Add missing columns if needed
      if (!columns.includes('item_id')) {
        console.log("Adding item_id column to sale_items table...");
        await query(`ALTER TABLE sale_items ADD COLUMN item_id INTEGER`);
      }
      
      if (!columns.includes('item_type')) {
        console.log("Adding item_type column to sale_items table...");
        await query(`ALTER TABLE sale_items ADD COLUMN item_type VARCHAR(50) NOT NULL DEFAULT 'product'`);
      }
      
      if (!columns.includes('name')) {
        console.log("Adding name column to sale_items table...");
        await query(`ALTER TABLE sale_items ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Unknown Product'`);
      }
      
      if (!columns.includes('quantity')) {
        console.log("Adding quantity column to sale_items table...");
        await query(`ALTER TABLE sale_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1`);
      }
      
      console.log("sale_items table structure updated successfully");
    }
    
    // Add type column to sales table if missing
    const salesColumnsResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales'
    `);
    
    const salesColumns = salesColumnsResult.rows.map(row => row.column_name);
    console.log("Existing sales columns:", salesColumns);
    
    if (!salesColumns.includes('type')) {
      console.log("Adding type column to sales table...");
      await query(`ALTER TABLE sales ADD COLUMN type VARCHAR(50) DEFAULT 'product'`);
    }
    
    console.log("Database schema fix completed successfully");
    
    return true;
  } catch (error) {
    console.error("Error fixing database schema:", error);
    return false;
  }
}

// Run the function
fixDatabase()
  .then(result => {
    if (result) {
      console.log("Database fix completed successfully");
      process.exit(0);
    } else {
      console.error("Database fix failed");
      process.exit(1);
    }
  })
  .catch(err => {
    console.error("Script error:", err);
    process.exit(1);
  }); 