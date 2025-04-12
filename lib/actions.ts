"use server"

import { revalidatePath } from "next/cache"
import { query, ensureDatabaseConnection } from "./db"
import {
  getData,
  saveData,
  getNextId,
  type Customer,
  type Service,
  type Appointment,
  type Product,
  type Sale,
  type SaleItem,
} from "./local-storage"

export type { Customer, Service, Appointment, Product, Sale, SaleItem }
export type NewCustomer = Omit<Customer, "id" | "visits" | "last_visit">
export type NewService = Omit<Service, "id">
export type NewAppointment = Omit<Appointment, "id" | "customer_name" | "service_name">
export type NewProduct = Omit<Product, "id">
export type NewSale = Omit<Sale, "id" | "customer_name">
export type NewSaleItem = Omit<SaleItem, "id" | "sale_id">

// Customer actions
export async function getCustomers() {
  console.log("getCustomers: Fetching all customers from database")
  await ensureDatabaseConnection()
  
  try {
    const result = await query("SELECT * FROM customers ORDER BY name")
    console.log(`getCustomers: Retrieved ${result.rows.length} customers from database`)
    
    // Format dates properly before returning
    const formattedCustomers = result.rows.map(customer => ({
      ...customer,
      // Convert any Date objects to ISO strings
      last_visit: customer.last_visit instanceof Date
        ? customer.last_visit.toISOString().split('T')[0]
        : customer.last_visit
    }))
    
    return formattedCustomers as Customer[]
  } catch (error) {
    console.error("getCustomers: Error fetching customers from database:", error)
    return []
  }
}

export async function getCustomerById(id: number) {
  await ensureDatabaseConnection()
  
  try {
    const result = await query("SELECT * FROM customers WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return null
    }
    
    const customer = result.rows[0];
    
    // Format dates before returning
    return {
      ...customer,
      last_visit: customer.last_visit instanceof Date
        ? customer.last_visit.toISOString().split('T')[0]
        : customer.last_visit
    } as Customer;
  } catch (error) {
    console.error("getCustomerById: Error fetching customer from database:", error)
    return null
  }
}

export async function createCustomer(customer: NewCustomer) {
  console.log("createCustomer: Creating new customer in database:", customer)
  await ensureDatabaseConnection()
  
  try {
    const result = await query(
      "INSERT INTO customers (name, phone, email, visits, last_visit) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [customer.name, customer.phone || "", customer.email || "", 0, null]
    )
    
    const newCustomer = result.rows[0]
    console.log("createCustomer: Customer created successfully with ID:", newCustomer.id)
    
    revalidatePath("/customers")
    return newCustomer as Customer
  } catch (error) {
    console.error("createCustomer: Error creating customer in database:", error)
    throw new Error("Müşteri oluşturulurken bir hata oluştu.")
  }
}

export async function updateCustomer(id: number, customer: Partial<Customer>) {
  await ensureDatabaseConnection()
  
  try {
    // First check if customer exists
    const checkResult = await query("SELECT id FROM customers WHERE id = $1", [id])
    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: `Customer with ID ${id} not found. The customer may have been deleted already.`,
      }
    }
    
    const result = await query(
      `UPDATE customers SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email)
      WHERE id = $4 RETURNING *`,
      [
        customer.name || null,
        customer.phone !== undefined ? customer.phone : null,
        customer.email !== undefined ? customer.email : null,
        id
      ]
    )
    
    revalidatePath("/customers")
    return result.rows[0] as Customer
  } catch (error) {
    console.error("updateCustomer: Error updating customer in database:", error)
    return {
      success: false,
      message: "Müşteri güncellenirken bir hata oluştu.",
    }
  }
}

export async function deleteCustomer(id: number) {
  await ensureDatabaseConnection()
  
  try {
    // First check if customer exists
    const checkResult = await query("SELECT id FROM customers WHERE id = $1", [id])
    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: `Customer with ID ${id} not found. The customer may have been deleted already.`,
      }
    }
    
    // Delete the customer (appointments will be cascade deleted because of foreign key constraint)
    await query("DELETE FROM customers WHERE id = $1", [id])
    
    revalidatePath("/customers")
    return { success: true, message: "Customer deleted successfully" }
  } catch (error) {
    console.error("deleteCustomer: Error deleting customer from database:", error)
    return {
      success: false,
      message: "Müşteri silinirken bir hata oluştu.",
    }
  }
}

// Service actions
export async function getServices() {
  console.log("getServices: Fetching all services from database")
  await ensureDatabaseConnection()
  
  try {
    const result = await query("SELECT * FROM services ORDER BY name")
    console.log(`getServices: Retrieved ${result.rows.length} services from database`)
    return result.rows as Service[]
  } catch (error) {
    console.error("getServices: Error fetching services from database:", error)
    return []
  }
}

export async function getServiceById(id: number) {
  await ensureDatabaseConnection()
  
  try {
    const result = await query("SELECT * FROM services WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return null
    }
    return result.rows[0] as Service
  } catch (error) {
    console.error("getServiceById: Error fetching service from database:", error)
    return null
  }
}

export async function createService(service: NewService) {
  console.log("createService: Creating new service in database:", service)
  await ensureDatabaseConnection()
  
  try {
    const result = await query(
      "INSERT INTO services (name, duration, price, description) VALUES ($1, $2, $3, $4) RETURNING *",
      [
        service.name,
        Number(service.duration) || 30,
        Number(service.price) || 0,
        service.description || ""
      ]
    )
    
    const newService = result.rows[0]
    console.log("createService: Service created successfully with ID:", newService.id)
    
    revalidatePath("/services")
    return newService as Service
  } catch (error) {
    console.error("createService: Error creating service in database:", error)
    throw new Error("Hizmet oluşturulurken bir hata oluştu.")
  }
}

export async function updateService(id: number, service: Partial<Service>) {
  await ensureDatabaseConnection()
  
  try {
    // First check if service exists
    const checkResult = await query("SELECT id FROM services WHERE id = $1", [id])
    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: `Service with ID ${id} not found. The service may have been deleted already.`,
      }
    }
    
    const result = await query(
      `UPDATE services SET 
        name = COALESCE($1, name),
        duration = COALESCE($2, duration),
        price = COALESCE($3, price),
        description = COALESCE($4, description)
      WHERE id = $5 RETURNING *`,
      [
        service.name || null,
        service.duration ? Number(service.duration) : null,
        service.price ? Number(service.price) : null,
        service.description !== undefined ? service.description : null,
        id
      ]
    )
    
    revalidatePath("/services")
    return result.rows[0] as Service
  } catch (error) {
    console.error("updateService: Error updating service in database:", error)
    return {
      success: false,
      message: "Hizmet güncellenirken bir hata oluştu.",
    }
  }
}

export async function deleteService(id: number) {
  await ensureDatabaseConnection()
  
  try {
    // First check if service exists
    const checkResult = await query("SELECT id FROM services WHERE id = $1", [id])
    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: `Service with ID ${id} not found. The service may have been deleted already.`,
      }
    }
    
    // Delete the service (appointments will be cascade deleted because of foreign key constraint)
    await query("DELETE FROM services WHERE id = $1", [id])
    
    revalidatePath("/services")
    return { success: true, message: "Service deleted successfully" }
  } catch (error) {
    console.error("deleteService: Error deleting service from database:", error)
    return {
      success: false,
      message: "Hizmet silinirken bir hata oluştu.",
    }
  }
}

// Appointment actions
export async function getAppointments() {
  console.log("getAppointments: Fetching all appointments from database")
  await ensureDatabaseConnection()
  
  try {
    const result = await query(`
      SELECT 
        a.*,
        c.name as customer_name,
        s.name as service_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN services s ON a.service_id = s.id
      ORDER BY a.date DESC, a.time ASC
    `)
    
    console.log(`getAppointments: Retrieved ${result.rows.length} appointments from database`)
    
    // Format dates properly before returning
    const formattedAppointments = result.rows.map(appointment => ({
      ...appointment,
      // Convert any Date objects to ISO strings
      date: appointment.date instanceof Date
        ? appointment.date.toISOString().split('T')[0]
        : appointment.date
    }))
    
    return formattedAppointments as Appointment[]
  } catch (error) {
    console.error("getAppointments: Error fetching appointments from database:", error)
    return []
  }
}

export async function getAppointmentsByDate(date: string) {
  console.log(`getAppointmentsByDate: Fetching appointments for date ${date}`)
  await ensureDatabaseConnection()
  
  try {
    const result = await query(`
      SELECT 
        a.*,
        c.name as customer_name,
        s.name as service_name
      FROM 
        appointments a
      JOIN 
        customers c ON a.customer_id = c.id
      JOIN 
        services s ON a.service_id = s.id
      WHERE 
        a.date = $1
      ORDER BY 
        a.time ASC
    `, [date])
    
    console.log(`getAppointmentsByDate: Retrieved ${result.rows.length} appointments for date ${date}`)
    
    // Format dates properly before returning
    const formattedAppointments = result.rows.map(appointment => ({
      ...appointment,
      // Convert any Date objects to ISO strings
      date: appointment.date instanceof Date
        ? appointment.date.toISOString().split('T')[0]
        : appointment.date
    }))
    
    return formattedAppointments as Appointment[]
  } catch (error) {
    console.error(`getAppointmentsByDate: Error fetching appointments for date ${date}:`, error)
    return []
  }
}

export async function getAppointmentById(id: number) {
  await ensureDatabaseConnection()
  
  try {
    const result = await query(`
      SELECT 
        a.*,
        c.name as customer_name,
        s.name as service_name
      FROM 
        appointments a
      LEFT JOIN 
        customers c ON a.customer_id = c.id
      LEFT JOIN 
        services s ON a.service_id = s.id
      WHERE 
        a.id = $1
    `, [id])
    
    if (result.rows.length === 0) {
      return null
    }
    
    const appointment = result.rows[0]
    return {
      ...appointment,
      customer_name: appointment.customer_name || "Unknown Customer",
      service_name: appointment.service_name || "Unknown Service"
    } as Appointment
  } catch (error) {
    console.error("getAppointmentById: Error fetching appointment from database:", error)
    return null
  }
}

export async function createAppointment(appointment: NewAppointment) {
  await ensureDatabaseConnection()
  
  try {
    // Verify customer and service exist
    const customerResult = await query("SELECT id, name FROM customers WHERE id = $1", [appointment.customer_id])
    const serviceResult = await query("SELECT id, name FROM services WHERE id = $1", [appointment.service_id])
    
    // Default to the first customer/service if specified one doesn't exist
    let actualCustomerId = appointment.customer_id
    let actualServiceId = appointment.service_id
    let customerName = "Unknown Customer"
    let serviceName = "Unknown Service"
    
    // If customer doesn't exist, try to get the first one
    if (customerResult.rows.length === 0) {
      const firstCustomerResult = await query("SELECT id, name FROM customers LIMIT 1")
      if (firstCustomerResult.rows.length > 0) {
        actualCustomerId = firstCustomerResult.rows[0].id
        customerName = firstCustomerResult.rows[0].name
      }
    } else {
      customerName = customerResult.rows[0].name
    }
    
    // If service doesn't exist, try to get the first one
    if (serviceResult.rows.length === 0) {
      const firstServiceResult = await query("SELECT id, name FROM services LIMIT 1")
      if (firstServiceResult.rows.length > 0) {
        actualServiceId = firstServiceResult.rows[0].id
        serviceName = firstServiceResult.rows[0].name
      }
    } else {
      serviceName = serviceResult.rows[0].name
    }
    
    // Create appointment
    const result = await query(`
      INSERT INTO appointments (
        customer_id, service_id, date, time, duration, status, notes, payment_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `, [
      actualCustomerId,
      actualServiceId,
      appointment.date,
      appointment.time,
      appointment.duration || 30,
      appointment.status || "onaylandı",
      appointment.notes || "",
      "unpaid"
    ])
    
    // Update customer's last visit and visits count
    if (customerResult.rows.length > 0) {
      await query(`
        UPDATE customers 
        SET last_visit = $1, visits = visits + 1 
        WHERE id = $2
      `, [appointment.date, actualCustomerId])
    }
    
    // Get the new appointment with names included
    const newAppointment = {
      ...result.rows[0],
      customer_name: customerName,
      service_name: serviceName
    }
    
    revalidatePath("/appointments")
    revalidatePath("/")
    
    return newAppointment as Appointment
  } catch (error) {
    console.error("createAppointment: Error creating appointment in database:", error)
    throw new Error("Randevu oluşturulurken bir hata oluştu.")
  }
}

export async function updateAppointment(id: number, appointment: Partial<Appointment>) {
  await ensureDatabaseConnection()
  
  try {
    // First check if appointment exists
    const checkResult = await query("SELECT id FROM appointments WHERE id = $1", [id])
    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: `Appointment with ID ${id} not found. The appointment may have been deleted already.`,
      }
    }
    
    // Build the update query dynamically based on which fields are provided
    const updateFields = []
    const values = []
    let paramIndex = 1
    
    if (appointment.customer_id !== undefined) {
      updateFields.push(`customer_id = $${paramIndex}`)
      values.push(appointment.customer_id)
      paramIndex++
    }
    
    if (appointment.service_id !== undefined) {
      updateFields.push(`service_id = $${paramIndex}`)
      values.push(appointment.service_id)
      paramIndex++
    }
    
    if (appointment.date !== undefined) {
      updateFields.push(`date = $${paramIndex}`)
      values.push(appointment.date)
      paramIndex++
    }
    
    if (appointment.time !== undefined) {
      updateFields.push(`time = $${paramIndex}`)
      values.push(appointment.time)
      paramIndex++
    }
    
    if (appointment.duration !== undefined) {
      updateFields.push(`duration = $${paramIndex}`)
      values.push(appointment.duration)
      paramIndex++
    }
    
    if (appointment.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      values.push(appointment.status)
      paramIndex++
    }
    
    if (appointment.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`)
      values.push(appointment.notes)
      paramIndex++
    }
    
    if (appointment.payment_status !== undefined) {
      updateFields.push(`payment_status = $${paramIndex}`)
      values.push(appointment.payment_status)
      paramIndex++
    }
    
    if (appointment.payment_method !== undefined) {
      updateFields.push(`payment_method = $${paramIndex}`)
      values.push(appointment.payment_method)
      paramIndex++
    }
    
    // If no fields to update, return the existing appointment
    if (updateFields.length === 0) {
      const result = await query(`
        SELECT 
          a.*,
          c.name as customer_name,
          s.name as service_name
        FROM 
          appointments a
        LEFT JOIN 
          customers c ON a.customer_id = c.id
        LEFT JOIN 
          services s ON a.service_id = s.id
        WHERE 
          a.id = $1
      `, [id])
      
      return result.rows[0] as Appointment
    }
    
    // Add the id parameter
    values.push(id)
    
    // Execute the update query
    const result = await query(`
      UPDATE appointments
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values)
    
    // Get the updated appointment with customer and service names
    const updatedAppointment = await query(`
      SELECT 
        a.*,
        c.name as customer_name,
        s.name as service_name
      FROM 
        appointments a
      LEFT JOIN 
        customers c ON a.customer_id = c.id
      LEFT JOIN 
        services s ON a.service_id = s.id
      WHERE 
        a.id = $1
    `, [id])
    
    revalidatePath("/appointments")
    revalidatePath("/")
    
    const appointment = updatedAppointment.rows[0]
    return {
      ...appointment,
      customer_name: appointment.customer_name || "Unknown Customer",
      service_name: appointment.service_name || "Unknown Service"
    } as Appointment
  } catch (error) {
    console.error("updateAppointment: Error updating appointment in database:", error)
    return {
      success: false,
      message: "Randevu güncellenirken bir hata oluştu."
    }
  }
}

export async function deleteAppointment(id: number) {
  await ensureDatabaseConnection()
  
  try {
    // First check if appointment exists
    const checkResult = await query("SELECT id FROM appointments WHERE id = $1", [id])
    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: `Appointment with ID ${id} not found. The appointment may have been deleted already.`,
      }
    }
    
    // Delete the appointment
    await query("DELETE FROM appointments WHERE id = $1", [id])
    
    revalidatePath("/appointments")
    revalidatePath("/")
    
    return { success: true, message: "Appointment deleted successfully" }
  } catch (error) {
    console.error("deleteAppointment: Error deleting appointment from database:", error)
    return {
      success: false,
      message: "Randevu silinirken bir hata oluştu."
    }
  }
}

// New function to process payment for an appointment
export async function processAppointmentPayment(id: number, paymentMethod: "card" | "cash") {
  await ensureDatabaseConnection()
  
  try {
    // Check if appointment exists
    const appointmentResult = await query(`
      SELECT 
        a.*,
        c.name as customer_name,
        s.name as service_name,
        s.price as service_price
      FROM 
        appointments a
      LEFT JOIN 
        customers c ON a.customer_id = c.id
      LEFT JOIN 
        services s ON a.service_id = s.id
      WHERE 
        a.id = $1
    `, [id])
    
    if (appointmentResult.rows.length === 0) {
      return {
        success: false,
        message: `Appointment with ID ${id} not found.`,
      }
    }
    
    const appointment = appointmentResult.rows[0]
    
    // Update appointment payment status
    await query(`
      UPDATE appointments 
      SET payment_status = 'paid', payment_method = $1
      WHERE id = $2
    `, [paymentMethod, id])
    
    // Create a sale record for this appointment
    const saleResult = await query(`
      INSERT INTO sales (
        customer_id, date, total, payment_method, type
      ) VALUES (
        $1, $2, $3, $4, 'service'
      ) RETURNING id
    `, [
      appointment.customer_id,
      new Date().toISOString().split('T')[0],
      appointment.service_price || 0,
      paymentMethod
    ])
    
    const saleId = saleResult.rows[0].id
    
    // Create sale item
    await query(`
      INSERT INTO sale_items (
        sale_id, item_id, item_type, name, price, quantity
      ) VALUES (
        $1, $2, 'service', $3, $4, 1
      )
    `, [
      saleId,
      appointment.service_id,
      appointment.service_name || "Unknown Service",
      appointment.service_price || 0
    ])
    
    revalidatePath("/appointments")
    revalidatePath("/sales")
    revalidatePath("/reports")
    
    return {
      success: true,
      message: "Payment processed successfully",
      sale: {
        id: saleId,
        customer_id: appointment.customer_id,
        date: new Date().toISOString().split('T')[0],
        total: appointment.service_price || 0,
        payment_method: paymentMethod,
        type: "service",
        customer_name: appointment.customer_name || "Unknown Customer"
      }
    }
  } catch (error) {
    console.error("processAppointmentPayment: Error processing payment in database:", error)
    return {
      success: false,
      message: "Ödeme işlenirken bir hata oluştu."
    }
  }
}

// Product actions
export async function getProducts() {
  console.log("getProducts: Fetching all products from database")
  await ensureDatabaseConnection()
  
  try {
    const result = await query("SELECT * FROM products ORDER BY name")
    console.log(`getProducts: Retrieved ${result.rows.length} products from database`)
    
    // Ensure price is returned as a number
    const formattedProducts = result.rows.map(product => ({
      ...product,
      price: Number(product.price),
      stock: Number(product.stock)
    }))
    
    return formattedProducts as Product[]
  } catch (error) {
    console.error("getProducts: Error fetching products from database:", error)
    return []
  }
}

export async function getProductById(id: number) {
  console.log(`getProductById: Fetching product with id ${id} from database`)
  await ensureDatabaseConnection()
  
  try {
    const result = await query("SELECT * FROM products WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return null
    }
    
    const product = result.rows[0];
    
    // Ensure price and stock are returned as numbers
    return {
      ...product,
      price: Number(product.price),
      stock: Number(product.stock)
    } as Product
  } catch (error) {
    console.error(`getProductById: Error fetching product with id ${id} from database:`, error)
    return null
  }
}

export async function createProduct(product: NewProduct) {
  console.log("createProduct: Creating new product in database:", product)
  await ensureDatabaseConnection()
  
  try {
    const result = await query(
      "INSERT INTO products (name, category, price, stock, description) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        product.name,
        product.category || "Diğer",
        Number(product.price) || 0,
        Number(product.stock) || 0,
        product.description || ""
      ]
    )
    
    const newProduct = result.rows[0]
    console.log("createProduct: Product created successfully with ID:", newProduct.id)
    
    revalidatePath("/products")
    return newProduct as Product
  } catch (error) {
    console.error("createProduct: Error creating product in database:", error)
    throw new Error("Ürün oluşturulurken bir hata oluştu.")
  }
}

export async function updateProduct(id: number, product: Partial<Product>) {
  console.log(`updateProduct: Updating product with id ${id} in database:`, product)
  await ensureDatabaseConnection()
  
  try {
    // First check if product exists
    const checkResult = await query("SELECT id FROM products WHERE id = $1", [id])
    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: `Product with ID ${id} not found. The product may have been deleted already.`,
      }
    }
    
    const result = await query(
      `UPDATE products SET 
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        price = COALESCE($3, price),
        stock = COALESCE($4, stock),
        description = COALESCE($5, description)
      WHERE id = $6 RETURNING *`,
      [
        product.name || null,
        product.category || null,
        product.price !== undefined ? Number(product.price) : null,
        product.stock !== undefined ? Number(product.stock) : null,
        product.description !== undefined ? product.description : null,
        id
      ]
    )
    
    revalidatePath("/products")
    return result.rows[0] as Product
  } catch (error) {
    console.error(`updateProduct: Error updating product with id ${id} in database:`, error)
    return {
      success: false,
      message: "Ürün güncellenirken bir hata oluştu.",
    }
  }
}

export async function deleteProduct(id: number) {
  console.log(`deleteProduct: Deleting product with id ${id} from database`)
  await ensureDatabaseConnection()
  
  try {
    // First check if product exists
    const checkResult = await query("SELECT id FROM products WHERE id = $1", [id])
    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: `Product with ID ${id} not found. The product may have been deleted already.`,
      }
    }
    
    // Delete the product
    await query("DELETE FROM products WHERE id = $1", [id])
    
    revalidatePath("/products")
    return { success: true, message: "Product deleted successfully" }
  } catch (error) {
    console.error(`deleteProduct: Error deleting product with id ${id} from database:`, error)
    return {
      success: false,
      message: "Ürün silinirken bir hata oluştu.",
    }
  }
}

// Sales actions
export async function getSales() {
  console.log("getSales: Fetching all sales from database")
  await ensureDatabaseConnection()
  
  try {
    // First get all sales
    const salesResult = await query(`
      SELECT 
        s.*,
        c.name as customer_name
      FROM 
        sales s
      LEFT JOIN 
        customers c ON s.customer_id = c.id
      ORDER BY 
        s.date DESC, s.id DESC
    `)
    
    // Then get the sale items for each sale
    const sales = await Promise.all(salesResult.rows.map(async (sale) => {
      const itemsResult = await query(`
        SELECT * FROM sale_items 
        WHERE sale_id = $1
      `, [sale.id])
      
      return {
        ...sale,
        customer_name: sale.customer_name || "Unknown Customer",
        // Format date correctly if it's a Date object
        date: sale.date instanceof Date ? sale.date.toISOString().split('T')[0] : sale.date,
        total: parseFloat(sale.total),
        items: itemsResult.rows.map(item => ({
          ...item,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity)
        }))
      }
    }))
    
    console.log(`getSales: Retrieved ${sales.length} sales from database`)
    return sales
  } catch (error) {
    console.error("getSales: Error fetching sales from database:", error)
    return []
  }
}

export async function getSaleById(id: number) {
  console.log(`getSaleById: Fetching sale with id ${id} from database`)
  await ensureDatabaseConnection()
  
  try {
    // Get the sale with customer name
    const saleResult = await query(`
      SELECT 
        s.*,
        c.name as customer_name
      FROM 
        sales s
      LEFT JOIN 
        customers c ON s.customer_id = c.id
      WHERE 
        s.id = $1
    `, [id])
    
    if (saleResult.rows.length === 0) {
      return null
    }
    
    const sale = saleResult.rows[0]
    
    // Get the sale items
    const itemsResult = await query(`
      SELECT * FROM sale_items 
      WHERE sale_id = $1
    `, [id])
    
    return {
      ...sale,
      customer_name: sale.customer_name || "Unknown Customer",
      // Format date correctly if it's a Date object
      date: sale.date instanceof Date ? sale.date.toISOString().split('T')[0] : sale.date,
      total: parseFloat(sale.total),
      items: itemsResult.rows.map(item => ({
        ...item,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity)
      }))
    }
  } catch (error) {
    console.error(`getSaleById: Error fetching sale with id ${id} from database:`, error)
    return null
  }
}

export async function createProductSale(
  customerId: number,
  items: { productId: number; quantity: number }[],
  paymentMethod: "card" | "cash",
) {
  console.log("createProductSale: Creating new product sale in database")
  await ensureDatabaseConnection()
  
  try {
    // Begin transaction
    await query('BEGIN')
    
    // Validate customer
    const customerResult = await query("SELECT * FROM customers WHERE id = $1", [customerId])
    if (customerResult.rows.length === 0) {
      await query('ROLLBACK')
      return {
        success: false,
        message: "Customer not found.",
      }
    }
    const customer = customerResult.rows[0]
    
    // Calculate total and validate products
    let total = 0
    const validatedItems = []
    
    for (const item of items) {
      // Get product information
      const productResult = await query("SELECT * FROM products WHERE id = $1", [item.productId])
      if (productResult.rows.length === 0) {
        await query('ROLLBACK')
        return {
          success: false,
          message: `Product with ID ${item.productId} not found.`,
        }
      }
      
      const product = productResult.rows[0]
      
      // Check stock
      if (parseInt(product.stock) < item.quantity) {
        await query('ROLLBACK')
        return {
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.stock}`,
        }
      }
      
      validatedItems.push({ 
        product: {
          ...product,
          price: parseFloat(product.price),
          stock: parseInt(product.stock)
        }, 
        quantity: item.quantity 
      })
      
      total += parseFloat(product.price) * item.quantity
    }
    
    // Create the sale
    const today = new Date().toISOString().split('T')[0]
    const saleResult = await query(
      `INSERT INTO sales 
        (customer_id, total, payment_method, date) 
       VALUES 
        ($1, $2, $3, $4) 
       RETURNING *`,
      [customerId, total, paymentMethod, today]
    )
    
    const sale = saleResult.rows[0]
    
    // Create sale items and update product stock
    const saleItems = []
    
    for (const item of validatedItems) {
      let insertQuery;
      let insertParams;
      
      // Check if the sale_items table has the item_id column
      try {
        // First try with new schema (item_id, item_type, name)
        insertQuery = `
          INSERT INTO sale_items 
            (sale_id, item_id, item_type, name, price, quantity) 
          VALUES 
            ($1, $2, $3, $4, $5, $6) 
          RETURNING *
        `;
        insertParams = [
          sale.id, 
          item.product.id, 
          'product', 
          item.product.name, 
          item.product.price, 
          item.quantity
        ];
        
        const saleItemResult = await query(insertQuery, insertParams);
        saleItems.push(saleItemResult.rows[0]);
      } catch (error) {
        console.error("Error with new schema, trying fallback:", error);
        
        // Check if it's a missing column error
        if (error.message && error.message.includes("column") && error.message.includes("does not exist")) {
          try {
            // Try with old schema (service_id)
            insertQuery = `
              INSERT INTO sale_items 
                (sale_id, service_id, price) 
              VALUES 
                ($1, $2, $3) 
              RETURNING *
            `;
            insertParams = [
              sale.id, 
              item.product.id, 
              item.product.price * item.quantity
            ];
            
            const saleItemResult = await query(insertQuery, insertParams);
            saleItems.push(saleItemResult.rows[0]);
          } catch (fallbackError) {
            // If both fail, roll back and report error
            console.error("Fallback also failed:", fallbackError);
            await query('ROLLBACK');
            return {
              success: false,
              message: "Error creating sale item: database schema mismatch",
            };
          }
        } else {
          // For other errors, roll back and report
          await query('ROLLBACK');
          return {
            success: false,
            message: "Error creating sale item: " + error.message,
          };
        }
      }
      
      // Update product stock
      await query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.product.id]
      )
    }
    
    // Update customer's last visit
    await query(
      "UPDATE customers SET last_visit = $1, visits = visits + 1 WHERE id = $2",
      [today, customerId]
    )
    
    // Commit transaction
    await query('COMMIT')
    
    console.log("createProductSale: Product sale created successfully with ID:", sale.id)
    
    revalidatePath("/sales")
    revalidatePath("/products")
    revalidatePath("/customers")
    revalidatePath("/reports")
    
    return {
      success: true,
      message: "Sale created successfully",
      sale: {
        ...sale,
        total: parseFloat(sale.total),
        customer_name: customer.name,
        items: saleItems.map(item => ({
          ...item,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity || '1')
        }))
      }
    }
  } catch (error) {
    // Rollback on error
    await query('ROLLBACK')
    console.error("createProductSale: Error creating product sale in database:", error)
    
    return {
      success: false,
      message: "Satış oluşturulurken bir hata oluştu.",
    }
  }
}

// Dashboard statistics
export async function getDashboardStats() {
  console.log("getDashboardStats: Fetching statistics from database")
  await ensureDatabaseConnection()
  
  try {
    const today = new Date().toISOString().split("T")[0]
    
    // Get today's appointments
    const todayAppointmentsResult = await query(`
      SELECT 
        status, 
        COUNT(*) as count
      FROM 
        appointments
      WHERE 
        date = $1
      GROUP BY 
        status
    `, [today])
    
    // Count appointments by status
    let pendingCount = 0
    let confirmedCount = 0
    let totalTodayCount = 0
    
    todayAppointmentsResult.rows.forEach(row => {
      if (row.status === 'beklemede') pendingCount = parseInt(row.count)
      if (row.status === 'onaylandı') confirmedCount = parseInt(row.count)
      totalTodayCount += parseInt(row.count)
    })
    
    // Get total appointments
    const totalAppointmentsResult = await query('SELECT COUNT(*) as count FROM appointments')
    const totalAppointments = parseInt(totalAppointmentsResult.rows[0]?.count || '0')
    
    // Get total customers
    const totalCustomersResult = await query('SELECT COUNT(*) as count FROM customers')
    const totalCustomers = parseInt(totalCustomersResult.rows[0]?.count || '0')
    
    // Get new customers this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0]
    
    const newCustomersResult = await query(`
      SELECT COUNT(*) as count 
      FROM customers 
      WHERE last_visit >= $1
    `, [oneWeekAgoStr])
    
    const newCustomers = parseInt(newCustomersResult.rows[0]?.count || '0')
    
    // For now, weekly revenue will be hardcoded as we haven't implemented sales in the database yet
    // This will be replaced with actual data when sales functionality is implemented
    const weeklyRevenue = 1250.0
    
    console.log("getDashboardStats: Successfully retrieved dashboard statistics")
    
    return {
      todayAppointments: {
        count: totalTodayCount,
        pending: pendingCount,
        confirmed: confirmedCount,
      },
      totalAppointments,
      totalCustomers,
      newCustomers,
      weeklyRevenue,
    }
  } catch (error) {
    console.error("getDashboardStats: Error fetching dashboard statistics:", error)
    // Return default values in case of error
    return {
      todayAppointments: {
        count: 0,
        pending: 0,
        confirmed: 0,
      },
      totalAppointments: 0,
      totalCustomers: 0,
      newCustomers: 0,
      weeklyRevenue: 0,
    }
  }
}

// Reporting functions
export async function getReportData() {
  console.log("getReportData: Fetching reporting data from database")
  await ensureDatabaseConnection()
  
  try {
    // Calculate dates
    const today = new Date()
    const oneMonthAgo = new Date(today)
    oneMonthAgo.setMonth(today.getMonth() - 1)
    const oneMonthAgoStr = oneMonthAgo.toISOString().split("T")[0]
    
    // Get appointment count
    const appointmentCountResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments
    `)
    const appointmentCount = parseInt(appointmentCountResult.rows[0]?.count || '0')
    
    // Get new customers in last month
    const newCustomersResult = await query(`
      SELECT COUNT(*) as count 
      FROM customers 
      WHERE created_at >= $1
    `, [oneMonthAgoStr])
    const newCustomersCount = parseInt(newCustomersResult.rows[0]?.count || '0')
    
    // Get total customers
    const totalCustomersResult = await query(`
      SELECT COUNT(*) as count 
      FROM customers
    `)
    const totalCustomersCount = parseInt(totalCustomersResult.rows[0]?.count || '0')
    
    // Get appointment time distribution
    const hourlyAppointmentsResult = await query(`
      SELECT 
        EXTRACT(HOUR FROM time::time) as hour, 
        COUNT(*) as count 
      FROM 
        appointments 
      GROUP BY 
        EXTRACT(HOUR FROM time::time)
      ORDER BY 
        hour
    `)
    
    const hourlyAppointments = {}
    for (let i = 8; i <= 20; i++) {
      hourlyAppointments[i] = 0
    }
    
    hourlyAppointmentsResult.rows.forEach(row => {
      const hour = parseInt(row.hour)
      if (hour >= 8 && hour <= 20) {
        hourlyAppointments[hour] = parseInt(row.count)
      }
    })
    
    // Get average service price
    const avgServicePriceResult = await query(`
      SELECT AVG(price) as avg_price 
      FROM services
    `)
    const avgServicePrice = parseFloat(avgServicePriceResult.rows[0]?.avg_price || '0').toFixed(2)
    
    // Get top services by appointment count
    const topServicesResult = await query(`
      SELECT 
        s.id,
        s.name,
        s.price,
        COUNT(a.id) as count
      FROM 
        services s
      LEFT JOIN 
        appointments a ON s.id = a.service_id
      GROUP BY 
        s.id, s.name, s.price
      ORDER BY 
        count DESC
      LIMIT 5
    `)
    
    const topServices = topServicesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      count: parseInt(row.count),
      revenue: parseInt(row.count) * parseFloat(row.price)
    }))
    
    // Get top products by stock decreases (since we don't have actual sales yet)
    const topProductsResult = await query(`
      SELECT 
        id,
        name,
        price,
        stock
      FROM 
        products
      ORDER BY 
        stock ASC, price DESC
      LIMIT 5
    `)
    
    const topProducts = topProductsResult.rows.map((row, index) => ({
      id: row.id,
      name: row.name,
      // Simulate sales based on remaining stock - lower stock means more sales
      count: Math.max(5 - parseInt(row.stock) % 5, 1) * (5 - index),
      revenue: Math.max(5 - parseInt(row.stock) % 5, 1) * (5 - index) * parseFloat(row.price)
    }))
    
    // Calculate daily revenue based on appointments and services
    // For each of the last 30 days
    const dailyRevenueResult = await query(`
      SELECT 
        a.date,
        SUM(s.price) as daily_revenue
      FROM 
        appointments a
      JOIN 
        services s ON a.service_id = s.id
      WHERE 
        a.date >= $1
        AND a.payment_status = 'paid'
      GROUP BY 
        a.date
      ORDER BY 
        a.date ASC
    `, [oneMonthAgoStr])
    
    // Initialize daily revenue with zeros
    const dailyRevenue = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      dailyRevenue[dateStr] = 0
    }
    
    // Fill in actual revenue data where available
    dailyRevenueResult.rows.forEach(row => {
      if (row.date in dailyRevenue) {
        dailyRevenue[row.date] = parseFloat(row.daily_revenue)
      }
    })
    
    // Get payment method stats (placeholder until sales table is implemented)
    const paymentMethodCounts = {
      card: Math.floor(appointmentCount * 0.6),  // 60% card payments (placeholder)
      cash: Math.floor(appointmentCount * 0.4)   // 40% cash payments (placeholder)
    }
    
    // Calculate monthly revenue
    const monthlyRevenueResult = await query(`
      SELECT 
        SUM(s.price) as monthly_revenue
      FROM 
        appointments a
      JOIN 
        services s ON a.service_id = s.id
      WHERE 
        a.date >= $1
        AND a.status = 'onaylandı'
    `, [oneMonthAgoStr])
    
    const monthlyRevenue = parseFloat(monthlyRevenueResult.rows[0]?.monthly_revenue || '0')
    
    console.log("getReportData: Successfully retrieved reporting data")
    
    return {
      topServices,
      topProducts,
      paymentMethods: paymentMethodCounts,
      dailyRevenue,
      monthlyRevenue,
      hourlyAppointments,
      stats: {
        appointmentCount,
        newCustomersCount,
        totalCustomersCount,
        avgServicePrice
      }
    }
  } catch (error) {
    console.error("getReportData: Error fetching reporting data:", error)
    // Return default empty values in case of error
    return {
      topServices: [],
      topProducts: [],
      paymentMethods: {
        card: 0,
        cash: 0,
      },
      dailyRevenue: {},
      monthlyRevenue: 0,
      hourlyAppointments: {},
      stats: {
        appointmentCount: 0,
        newCustomersCount: 0,
        totalCustomersCount: 0,
        avgServicePrice: 0
      }
    }
  }
}

