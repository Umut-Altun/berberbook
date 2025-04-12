// Define types for our database connection
type QueryResult = {
  rows: any[]
  rowCount: number
}

type Pool = {
  query: (text: string, params?: any[]) => Promise<QueryResult>
  on: (event: string, callback: (err: Error) => void) => void
}

// Create a pool variable that will be initialized
let pool: Pool | null = null

// Helper function to initialize the database connection
async function initPool() {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    console.warn("Running in browser environment - using mock database")
    // Create a mock pool for browser environments
    pool = createMockPool()
    return true
  }

  try {
    // Dynamic import for pg - this will only work on the server
    const pg = await import("pg").catch((err) => {
      console.error("Failed to import pg module:", err)
      return null
    })

    if (!pg) {
      console.error("pg module not available, using mock database")
      pool = createMockPool()
      return true
    }

    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable not set")
      return false
    }

    console.log("Connecting to Neon database:", process.env.DATABASE_URL.split("@")[1]?.split("/")[0] || "unknown")

    // Create a connection pool using the provided Neon connection string
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true, // Required for secure connections to Neon
      },
      max: 10, // Reduce maximum number of clients in the pool
      idleTimeoutMillis: 60000, // Increased idle timeout to 60 seconds 
      connectionTimeoutMillis: 30000, // Increased connection timeout to 30 seconds
    })

    // Test the connection
    pool.on("error", (err: Error) => {
      console.error("Unexpected error on idle client", err)
    })

    // Verify connection
    try {
      const res = await pool.query("SELECT NOW()")
      console.log("Neon database connected successfully at:", res.rows[0]?.now)
      return true
    } catch (err) {
      console.error("Neon database connection error:", err)
      return false
    }
  } catch (error) {
    console.error("Error initializing database pool:", error)
    // Fall back to mock database
    pool = createMockPool()
    return true
  }
}

// Ensure database connection is established
export async function ensureDatabaseConnection() {
  try {
    if (!pool) {
      const initialized = await initPool()
      return initialized
    }
    return true
  } catch (error) {
    console.error("Error ensuring database connection:", error)
    return false
  }
}

// Create a mock pool for browser environments
function createMockPool(): Pool {
  console.log("Creating mock database pool")

  // Mock data for testing
  const mockCustomers = [
    {
      id: 1,
      name: "Ahmet Yılmaz",
      phone: "555-1234",
      email: "ahmet@example.com",
      visits: 12,
      last_visit: "2025-03-15",
    },
    { id: 2, name: "Ayşe Demir", phone: "555-5678", email: "ayse@example.com", visits: 8, last_visit: "2025-03-20" },
  ]

  const mockServices = [
    { id: 1, name: "Saç Kesimi", duration: 30, price: 100, description: "Standart saç kesimi" },
    { id: 2, name: "Sakal Tıraşı", duration: 20, price: 50, description: "Sakal şekillendirme" },
  ]

  const mockData = {
    customers: [...mockCustomers],
    services: [...mockServices],
    appointments: [],
  }

  return {
    query: async (text: string, params?: any[]): Promise<QueryResult> => {
      console.log("Mock query:", text, params)

      // Handle different query types
      if (text.toLowerCase().includes("select * from customers")) {
        return { rows: mockData.customers, rowCount: mockData.customers.length }
      }

      if (text.toLowerCase().includes("select * from services")) {
        return { rows: mockData.services, rowCount: mockData.services.length }
      }

      if (text.toLowerCase().includes("insert into customers")) {
        const newId = mockData.customers.length + 1
        const newCustomer = {
          id: newId,
          name: params?.[0] || "New Customer",
          phone: params?.[1] || "",
          email: params?.[2] || "",
          visits: 0,
          last_visit: null,
        }
        mockData.customers.push(newCustomer)
        return { rows: [newCustomer], rowCount: 1 }
      }

      if (text.toLowerCase().includes("insert into services")) {
        const newId = mockData.services.length + 1
        const newService = {
          id: newId,
          name: params?.[0] || "New Service",
          duration: params?.[1] || 30,
          price: params?.[2] || 0,
          description: params?.[3] || "",
        }
        mockData.services.push(newService)
        return { rows: [newService], rowCount: 1 }
      }

      // Default empty response
      return { rows: [], rowCount: 0 }
    },
    on: (event: string, callback: (err: Error) => void): void => {
      // Do nothing
    },
  }
}

// Helper function to execute SQL queries
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  if (!pool) {
    const initialized = await initPool()
    if (!initialized) {
      console.error("Database pool not initialized")
      throw new Error("Database connection failed: Pool not initialized")
    }
  }

  const maxRetries = 3;
  let currentRetry = 0;
  let lastError = null;

  while (currentRetry < maxRetries) {
    try {
      const start = Date.now()
      const res = await pool.query(text, params)
      const duration = Date.now() - start
      console.log("Executed query", { text, duration, rowCount: res.rowCount })
      return res
    } catch (error) {
      lastError = error;
      
      // Check if this is a connection-related error that might be retriable
      const isRetriableError = error.message && (
        error.message.includes("Connection terminated") || 
        error.message.includes("timeout") ||
        error.message.includes("connection")
      );

      if (isRetriableError && currentRetry < maxRetries - 1) {
        currentRetry++;
        console.warn(`Database query failed with connection error, retrying (attempt ${currentRetry} of ${maxRetries-1})...`);
        
        // Add increasing delay between retries (exponential backoff)
        const delay = 1000 * Math.pow(2, currentRetry - 1); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Either not a retriable error or we've used all retries
      console.error("Error executing query", { text, params, error, attempt: currentRetry + 1 })
      throw error;
    }
  }

  // This should never be reached given the structure above, but just in case
  throw lastError;
}

// Initialize database tables if they don't exist
export async function initDatabase() {
  console.log("Starting Neon database initialization...")

  // Initialize pool if not already done
  if (!pool) {
    const initialized = await initPool()
    if (!initialized) {
      console.error("Failed to initialize database pool")
      return false
    }
  }

  try {
    // First, check if we can connect to the database
    const testResult = await query("SELECT 1 as test")
    console.log("Neon database connection test successful")

    // Create customers table
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        visits INTEGER DEFAULT 0,
        last_visit DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Customers table created or already exists")

    // Create services table
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        duration INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Services table created or already exists")

    // Create appointments table
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'beklemede',
        notes TEXT,
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Appointments table created or already exists")

    // Create products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'Diğer',
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Products table created or already exists")

    // Create sales table
    await query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        total DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Sales table created or already exists")

    // Create sale_items table
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
    `)
    console.log("Sale_items table created or already exists")

    console.log("Neon database initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing Neon database", error)
    return false
  }
}

// Reset database - drops all tables and recreates them
export async function resetDatabase() {
  console.log("Starting Neon database reset...")

  // Initialize pool if not already done
  if (!pool) {
    const initialized = await initPool()
    if (!initialized) {
      console.error("Failed to initialize database pool")
      return false
    }
  }

  try {
    // Drop all tables in the correct order to respect foreign key constraints
    await query(`DROP TABLE IF EXISTS sale_items CASCADE`)
    await query(`DROP TABLE IF EXISTS sales CASCADE`)
    await query(`DROP TABLE IF EXISTS appointments CASCADE`)
    await query(`DROP TABLE IF EXISTS products CASCADE`)
    await query(`DROP TABLE IF EXISTS services CASCADE`)
    await query(`DROP TABLE IF EXISTS customers CASCADE`)

    console.log("All tables dropped successfully")

    // Recreate the database
    const initialized = await initDatabase()
    if (!initialized) {
      throw new Error("Failed to recreate database tables")
    }

    console.log("Neon database reset successfully")
    return true
  } catch (error) {
    console.error("Error resetting Neon database", error)
    return false
  }
}

// Migrate database - adds missing columns to existing tables
export async function migrateDatabase() {
  console.log("Starting Neon database migration...")

  // Initialize pool if not already done
  if (!pool) {
    const initialized = await initPool()
    if (!initialized) {
      console.error("Failed to initialize database pool")
      return false
    }
  }

  try {
    // Check if payment_status column exists in appointments table
    const paymentStatusExists = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'payment_status'
    `)

    if (paymentStatusExists.rows.length === 0) {
      console.log("Adding payment_status column to appointments table...")
      await query(`
        ALTER TABLE appointments 
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid'
      `)
      console.log("payment_status column added successfully")
    }

    // Check if payment_method column exists in appointments table
    const paymentMethodExists = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'payment_method'
    `)

    if (paymentMethodExists.rows.length === 0) {
      console.log("Adding payment_method column to appointments table...")
      await query(`
        ALTER TABLE appointments 
        ADD COLUMN payment_method VARCHAR(50)
      `)
      console.log("payment_method column added successfully")
    }
    
    // Check if products table exists
    const productsTableExists = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'products'
    `)
    
    if (productsTableExists.rows.length === 0) {
      console.log("Creating products table...")
      await query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) DEFAULT 'Diğer',
          price DECIMAL(10, 2) NOT NULL DEFAULT 0,
          stock INTEGER NOT NULL DEFAULT 0,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log("Products table created successfully")
    }

    // Ensure sales table exists for reporting
    const salesTableExists = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'sales'
    `)

    if (salesTableExists.rows.length === 0) {
      console.log("Creating sales table...")
      await query(`
        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
          customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          total DECIMAL(10, 2) NOT NULL,
          payment_method VARCHAR(50) NOT NULL,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log("Sales table created successfully")
    }

    // Ensure sale_items table exists for reporting
    const saleItemsTableExists = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'sale_items'
    `)

    if (saleItemsTableExists.rows.length === 0) {
      console.log("Creating sale_items table...")
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
      `)
      console.log("Sale_items table created successfully")
    } else {
      // Check if item_id column exists
      const itemIdExists = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items' AND column_name = 'item_id'
      `)

      if (itemIdExists.rows.length === 0) {
        console.log("Adding missing columns to sale_items table...")
        await query(`
          ALTER TABLE sale_items 
          ADD COLUMN item_id INTEGER,
          ADD COLUMN item_type VARCHAR(50) NOT NULL DEFAULT 'product',
          ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Unknown Product',
          ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1
        `)
        console.log("Missing columns added to sale_items table")
      }
    }

    // Update the original schema creation function to match the migration
    await query(`
      CREATE OR REPLACE FUNCTION public.init_sale_items_table() RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS sale_items (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
          item_id INTEGER,
          item_type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log("Neon database migration completed successfully")
    return true
  } catch (error) {
    console.error("Error migrating Neon database", error)
    return false
  }
}

// Seed initial data if tables are empty
export async function seedInitialData() {
  try {
    console.log("Starting to seed initial data in Neon...")

    // Check if customers table is empty
    const customersResult = await query("SELECT COUNT(*) FROM customers")
    const customerCount = Number.parseInt(customersResult.rows[0]?.count || "0")
    console.log(`Current customer count: ${customerCount}`)

    if (customerCount === 0) {
      // Insert sample customers
      console.log("Inserting sample customers...")
      await query(`
        INSERT INTO customers (name, phone, email, visits, last_visit) VALUES
        ('Ahmet Yılmaz', '555-1234', 'ahmet@example.com', 12, '2025-03-15'),
        ('Ayşe Demir', '555-5678', 'ayse@example.com', 8, '2025-03-20'),
        ('Mehmet Kaya', '555-9012', 'mehmet@example.com', 5, '2025-03-10'),
        ('Zeynep Yıldız', '555-3456', 'zeynep@example.com', 15, '2025-03-25')
      `)
      console.log("Sample customers added to Neon")
    }

    // Check if services table is empty
    const servicesResult = await query("SELECT COUNT(*) FROM services")
    const serviceCount = Number.parseInt(servicesResult.rows[0]?.count || "0")
    console.log(`Current service count: ${serviceCount}`)

    if (serviceCount === 0) {
      // Insert sample services
      console.log("Inserting sample services...")
      await query(`
        INSERT INTO services (name, duration, price, description) VALUES
        ('Saç Kesimi', 30, 100, 'Standart saç kesimi ve şekillendirme'),
        ('Sakal Tıraşı', 20, 50, 'Sakal şekillendirme ve düzeltme'),
        ('Saç & Sakal', 45, 140, 'Saç kesimi ve sakal düzenleme'),
        ('Saç Boyama', 90, 250, 'Tam saç boyama hizmeti'),
        ('Klasik Tıraş', 30, 80, 'Geleneksel ustura tıraşı')
      `)
      console.log("Sample services added to Neon")
    }

    // Check if appointments table is empty
    const appointmentsResult = await query("SELECT COUNT(*) FROM appointments")
    const appointmentCount = Number.parseInt(appointmentsResult.rows[0]?.count || "0")
    console.log(`Current appointment count: ${appointmentCount}`)

    if (appointmentCount === 0) {
      // Get customer and service IDs
      const customers = await query("SELECT id FROM customers ORDER BY id LIMIT 4")
      const services = await query("SELECT id FROM services ORDER BY id LIMIT 5")

      console.log("Available customers for seeding:", customers.rows)
      console.log("Available services for seeding:", services.rows)

      if (customers.rows.length > 0 && services.rows.length > 0) {
        // Insert sample appointments
        console.log("Inserting sample appointments...")

        // Use the first customer and service if we don't have enough
        const customer1 = customers.rows[0]?.id || 1
        const customer2 = customers.rows.length > 1 ? customers.rows[1]?.id : customer1
        const customer3 = customers.rows.length > 2 ? customers.rows[2]?.id : customer1
        const customer4 = customers.rows.length > 3 ? customers.rows[3]?.id : customer1

        const service1 = services.rows[0]?.id || 1
        const service2 = services.rows.length > 1 ? services.rows[1]?.id : service1
        const service3 = services.rows.length > 2 ? services.rows[2]?.id : service1
        const service4 = services.rows.length > 3 ? services.rows[3]?.id : service1

        await query(
          `
          INSERT INTO appointments (customer_id, service_id, date, time, duration, status) VALUES
          ($1, $2, '2025-03-28', '10:00', 30, 'onaylandı'),
          ($3, $4, '2025-03-28', '11:30', 45, 'onaylandı'),
          ($5, $6, '2025-03-29', '14:00', 20, 'onaylandı'),
          ($7, $8, '2025-03-30', '15:30', 90, 'beklemede')
        `,
          [customer1, service1, customer2, service3, customer3, service2, customer4, service4],
        )
        console.log("Sample appointments added to Neon")
      } else {
        console.warn("Not enough customers or services to create sample appointments")
      }
    }

    // Check if products table is empty
    const productsResult = await query("SELECT COUNT(*) FROM products")
    const productCount = Number.parseInt(productsResult.rows[0]?.count || "0")
    console.log(`Current product count: ${productCount}`)
    
    if (productCount === 0) {
      // Insert sample products
      console.log("Inserting sample products...")
      await query(`
        INSERT INTO products (name, category, price, stock, description) VALUES
        ('Saç Şekillendirici Wax', 'Saç Şekillendirici', 120, 15, 'Profesyonel saç şekillendirici wax, güçlü tutuş sağlar.'),
        ('Sakal Bakım Yağı', 'Sakal Bakımı', 85, 10, 'Sakalı yumuşatan ve besleyen doğal içerikli bakım yağı.'),
        ('Erkek Şampuanı', 'Şampuan', 75, 20, 'Erkeklere özel günlük kullanım şampuanı.'),
        ('Saç Kremi', 'Saç Kremi', 65, 12, 'Saçı yumuşatan ve bakım sağlayan saç kremi.'),
        ('Saç Spreyi', 'Saç Şekillendirici', 95, 8, 'Uzun süre kalıcı ve hızlı kuruyan saç spreyi.')
      `)
      console.log("Sample products added to database")
    }

    console.log("Initial data seeded successfully in Neon")
    return true
  } catch (error) {
    console.error("Error seeding initial data in Neon", error)
    return false
  }
}

// Update the checkDatabaseStatus function
export async function checkDatabaseStatus() {
  try {
    if (!pool) {
      const initialized = await initPool()
      if (!initialized) {
        return {
          connected: false,
          message: "Failed to initialize Neon database pool",
        }
      }
    }

    // Use a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Neon database query timed out after 5 seconds"))
      }, 5000)
    })

    try {
      // Race the query against the timeout
      const result = await Promise.race([query("SELECT 1 as connected"), timeoutPromise])

      return {
        connected: true,
        message: "Neon database connection successful",
      }
    } catch (queryError) {
      console.error("Neon database query error:", queryError)
      return {
        connected: false,
        message: queryError instanceof Error ? queryError.message : "Neon database query failed",
      }
    }
  } catch (error) {
    console.error("Neon database connection check failed:", error)
    return {
      connected: false,
      message: error instanceof Error ? error.message : "Unknown Neon database error",
    }
  }
}

