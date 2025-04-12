"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import NewCustomerDialog from "@/components/new-customer-dialog"
import CustomerTable from "@/components/customer-table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { getCustomers } from "@/lib/actions"

// Loading skeleton for the customers table
function CustomersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[300px]" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log("Fetching customers from server actions...")
      const customerData = await getCustomers()
      console.log("Customers received:", customerData)
      setCustomers(customerData)
      setError(null)
    } catch (err) {
      console.error("Error fetching customers:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log("Initial customer list fetch...")
    fetchCustomers()
  }, [fetchCustomers])

  const handleCustomerAdded = () => {
    // Fetch customers again when a new customer is added
    console.log("Customer added, refreshing customer list...")
    fetchCustomers()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Müşteriler</h1>
          <p className="text-muted-foreground mt-1">Müşteri veritabanınızı yönetin</p>
        </div>
        <NewCustomerDialog onSuccess={handleCustomerAdded} />
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle>Müşteri Veritabanı</CardTitle>
          <CardDescription>Tüm müşterilerinizi görüntüleyin ve yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CustomersTableSkeleton />
          ) : error ? (
            <div className="p-8 text-center bg-red-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-red-800">Veri Yükleme Hatası</h2>
              <p className="text-red-700">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchCustomers}>
                Tekrar Dene
              </Button>
            </div>
          ) : (
            <CustomerTable customers={customers} onCustomerChange={fetchCustomers} />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={fetchCustomers} disabled={isLoading}>
            {isLoading ? "Yükleniyor..." : "Müşterileri Yenile"}
          </Button>
          <NewCustomerDialog onSuccess={handleCustomerAdded}>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Müşteri
            </Button>
          </NewCustomerDialog>
        </CardFooter>
      </Card>
    </div>
  )
}

