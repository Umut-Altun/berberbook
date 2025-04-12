// Types for our data models
export type Customer = {
  id: number
  name: string
  phone: string
  email: string
  visits: number
  last_visit: string | null
}

export type Service = {
  id: number
  name: string
  duration: number
  price: number
  description: string
}

export type Appointment = {
  id: number
  customer_id: number
  service_id: number
  date: string
  time: string
  duration: number
  status: string
  notes?: string
  customer_name?: string
  service_name?: string
  payment_status?: "paid" | "unpaid"
  payment_method?: "card" | "cash" | null
}

export type Product = {
  id: number
  name: string
  category: string
  price: number
  stock: number
  description: string
}

export type Sale = {
  id: number
  customer_id: number
  date: string
  items: SaleItem[]
  total: number
  payment_method: "card" | "cash"
  type: "service" | "product"
  customer_name?: string
}

export type SaleItem = {
  id: number
  sale_id: number
  item_id: number
  item_type: "service" | "product"
  name: string
  price: number
  quantity: number
}

// Initial empty state
const initialState = {
  customers: [] as Customer[],
  services: [] as Service[],
  appointments: [] as Appointment[],
  products: [] as Product[],
  sales: [] as Sale[],
  saleItems: [] as SaleItem[],
  nextIds: {
    customer: 1,
    service: 1,
    appointment: 1,
    product: 1,
    sale: 1,
    saleItem: 1,
  },
}

// LocalStorage key
const STORAGE_KEY = "barberbook_data"

// Helper to get data from localStorage
export function getData() {
  if (typeof window === "undefined") {
    console.log("getData: window undefined, returning initialState")
    return initialState
  }

  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (!storedData) {
      console.log("getData: No data in localStorage, returning initialState")
      return initialState
    }
    const parsedData = JSON.parse(storedData)
    console.log("getData: Retrieved data from localStorage:", parsedData)
    return parsedData
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return initialState
  }
}

// Helper to save data to localStorage
export function saveData(data: any) {
  if (typeof window === "undefined") {
    console.log("saveData: window undefined, data not saved")
    return
  }

  try {
    console.log("saveData: Saving data to localStorage:", data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    console.log("saveData: Data saved successfully")
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

// Helper to get the next ID for a specific entity
export function getNextId(entityType: "customer" | "service" | "appointment" | "product" | "sale" | "saleItem") {
  const data = getData()
  const nextId = data.nextIds[entityType]

  // Update the next ID
  data.nextIds[entityType] = nextId + 1
  saveData(data)

  return nextId
}

// Clear all data (reset to initial state)
export function clearAllData() {
  saveData(initialState)
}

// Check if localStorage is available
export function isLocalStorageAvailable() {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const testKey = "__test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

