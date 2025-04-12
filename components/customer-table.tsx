"use client"

import { useState, useCallback, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Customer } from "@/lib/actions"
import CustomerActions from "@/components/customer-actions"
import CustomerSearch from "@/components/customer-search"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface CustomerTableProps {
  customers: Customer[]
  onCustomerChange?: () => void
}

export default function CustomerTable({ customers: initialCustomers, onCustomerChange }: CustomerTableProps) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Update local state when initialCustomers changes
  useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

  // Memoize the search handler to prevent it from changing on every render
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle customer change (edit/delete)
  const handleCustomerChange = useCallback(() => {
    if (onCustomerChange) {
      onCustomerChange()
    }
  }, [onCustomerChange])

  // Refresh customers
  const refreshCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      if (onCustomerChange) {
        onCustomerChange()
      }
    } catch (error) {
      console.error("Error refreshing customers:", error)
      toast({
        title: "Hata",
        description: "Müşteriler yenilenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [onCustomerChange, toast])

  // Filter customers based on the search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCustomers}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Yenile
        </Button>
        <CustomerSearch onSearchChange={handleSearchChange} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Yükleniyor...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İsim</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Toplam Ziyaret</TableHead>
              <TableHead>Son Ziyaret</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.visits}</TableCell>
                  <TableCell>
                    {customer.last_visit 
                      ? (customer.last_visit instanceof Date 
                          ? customer.last_visit.toISOString().split('T')[0] 
                          : customer.last_visit) 
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <CustomerActions customer={customer} onSuccess={handleCustomerChange} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchQuery ? "Arama kriterlerine uygun müşteri bulunamadı." : "Müşteri bulunamadı."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

