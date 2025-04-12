"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function NewAppointmentDialog({
  children,
  initialDate,
  onSuccess,
}: {
  children?: React.ReactNode
  initialDate?: string
  onSuccess?: () => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [customers, setCustomers] = useState<{ id: number; name: string; phone: string }[]>([])
  const [services, setServices] = useState<{ id: number; name: string; duration: number; price: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [phoneSearch, setPhoneSearch] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<typeof customers>([])
  const [showAllCustomers, setShowAllCustomers] = useState(false)

  const [newAppointment, setNewAppointment] = useState({
    customer_id: 0,
    service_id: 0,
    date: initialDate || new Date().toISOString().split("T")[0],
    time: "09:00",
    duration: 30,
    status: "onaylandı",
    notes: "",
  })

  useEffect(() => {
    if (initialDate) {
      setNewAppointment((prev) => ({
        ...prev,
        date: initialDate,
      }))
    }
  }, [initialDate])

  // Filter customers based on phone search
  useEffect(() => {
    if (!phoneSearch.trim()) {
      // If search is empty and showAllCustomers is true, show all customers
      if (showAllCustomers) {
        setFilteredCustomers(customers)
      } else {
        // Otherwise show no customers until user searches
        setFilteredCustomers([])
      }
      return
    }

    // Filter customers based on phone search
    const filtered = customers.filter(
      (customer) => customer.phone && customer.phone.toLowerCase().includes(phoneSearch.toLowerCase()),
    )
    setFilteredCustomers(filtered)
  }, [phoneSearch, customers, showAllCustomers])

  // Improved fetchData function with better customer validation
  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true)
    }

    try {
      console.log("Fetching customers and services data...")

      // Fetch customers with timestamp to bust cache
      const timestamp = Date.now()
      const customersResponse = await fetch(`/api/customers?t=${timestamp}`, {
        cache: "no-store",
      })

      if (!customersResponse.ok) {
        const errorText = await customersResponse.text()
        console.error("Failed to fetch customers:", customersResponse.status, errorText)
        throw new Error(`Failed to fetch customers: ${customersResponse.status}`)
      }

      let customersData
      try {
        customersData = await customersResponse.json()
      } catch (jsonError) {
        console.error("Failed to parse customers JSON:", jsonError)
        throw new Error("Invalid JSON response from customers API")
      }

      console.log(`Fetched ${customersData.length} customers:`, customersData)

      // Ensure we have at least one customer
      if (customersData.length === 0) {
        console.error("No customers returned from API")
        toast({
          title: "Veri yükleme hatası",
          description: "Müşteri listesi boş. Lütfen önce bir müşteri ekleyin.",
          variant: "destructive",
        })
        setCustomers([])
        return
      }

      // Fetch services with timestamp to bust cache
      const servicesResponse = await fetch(`/api/services?t=${timestamp}`, {
        cache: "no-store",
      })

      if (!servicesResponse.ok) {
        const errorText = await servicesResponse.text()
        console.error("Failed to fetch services:", servicesResponse.status, errorText)
        throw new Error(`Failed to fetch services: ${servicesResponse.status}`)
      }

      let servicesData
      try {
        servicesData = await servicesResponse.json()
      } catch (jsonError) {
        console.error("Failed to parse services JSON:", jsonError)
        throw new Error("Invalid JSON response from services API")
      }

      console.log(`Fetched ${servicesData.length} services:`, servicesData)

      // Update state with fetched data
      setCustomers(customersData)
      setServices(servicesData)

      // If no customer is selected yet or the selected customer doesn't exist, select the first one
      const customerExists = customersData.some((c) => c.id === newAppointment.customer_id)
      if (!customerExists && customersData.length > 0) {
        console.log(
          `Selected customer ID ${newAppointment.customer_id} not found in fetched data, selecting first customer instead`,
        )
        setNewAppointment((prev) => ({
          ...prev,
          customer_id: customersData[0].id,
        }))
      }

      // If no service is selected yet or the selected service doesn't exist, select the first one
      const serviceExists = servicesData.some((s) => s.id === newAppointment.service_id)
      if (!serviceExists && servicesData.length > 0) {
        console.log(
          `Selected service ID ${newAppointment.service_id} not found in fetched data, selecting first service instead`,
        )
        setNewAppointment((prev) => ({
          ...prev,
          service_id: servicesData[0].id,
          duration: servicesData[0].duration || 30,
        }))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setFormError("Veri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.")

      toast({
        title: "Veri yükleme hatası",
        description: error instanceof Error ? error.message : "Müşteriler ve hizmetler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Improved form validation
  const validateForm = () => {
    // Validate that a customer is selected
    if (!newAppointment.customer_id) {
      setFormError("Lütfen bir müşteri seçin")
      return false
    }

    // Validate that a service is selected
    if (!newAppointment.service_id) {
      setFormError("Lütfen bir hizmet seçin")
      return false
    }

    // Validate date and time
    if (!newAppointment.date) {
      setFormError("Lütfen bir tarih seçin")
      return false
    }

    if (!newAppointment.time) {
      setFormError("Lütfen bir saat seçin")
      return false
    }

    // Validate that the selected customer exists in the customers list
    const customerExists = customers.some((c) => c.id === newAppointment.customer_id)
    if (!customerExists) {
      // If customer doesn't exist but we have customers, select the first one
      if (customers.length > 0) {
        setNewAppointment((prev) => ({
          ...prev,
          customer_id: customers[0].id,
        }))
        console.log(`Auto-selected first customer: ${customers[0].name} (ID: ${customers[0].id})`)
        return true
      } else {
        setFormError(`Seçilen müşteri (ID: ${newAppointment.customer_id}) bulunamadı. Lütfen başka bir müşteri seçin.`)
        return false
      }
    }

    // Validate that the selected service exists in the services list
    const serviceExists = services.some((s) => s.id === newAppointment.service_id)
    if (!serviceExists) {
      // If service doesn't exist but we have services, select the first one
      if (services.length > 0) {
        const firstService = services[0]
        setNewAppointment((prev) => ({
          ...prev,
          service_id: firstService.id,
          duration: firstService.duration || 30,
        }))
        console.log(`Auto-selected first service: ${firstService.name} (ID: ${firstService.id})`)
        return true
      } else {
        setFormError(`Seçilen hizmet (ID: ${newAppointment.service_id}) bulunamadı. Lütfen başka bir hizmet seçin.`)
        return false
      }
    }

    setFormError("")
    return true
  }

  // Improved handleAddAppointment function with better error handling
  const handleAddAppointment = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)
      console.log("Submitting appointment:", newAppointment)

      // Double-check that the customer exists in our local state
      const customerExists = customers.some((c) => c.id === newAppointment.customer_id)
      if (!customerExists && customers.length > 0) {
        console.warn(
          `Customer ID ${newAppointment.customer_id} not found in local state, using first available customer`,
        )
        newAppointment.customer_id = customers[0].id
      }

      // Double-check that the service exists in our local state
      const serviceExists = services.some((s) => s.id === newAppointment.service_id)
      if (!serviceExists && services.length > 0) {
        console.warn(`Service ID ${newAppointment.service_id} not found in local state, using first available service`)
        newAppointment.service_id = services[0].id
      }

      // Try to create the appointment using the API endpoint
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAppointment),
      })

      // First check if the response is ok
      if (!response.ok) {
        // Try to get the response as text first
        const responseText = await response.text()

        // Try to parse as JSON if possible
        let errorData
        try {
          errorData = JSON.parse(responseText)
          throw new Error(errorData.message || `Error: ${response.status}`)
        } catch (jsonError) {
          // If JSON parsing fails, use the text response
          console.error("Non-JSON error response:", responseText)
          throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`)
        }
      }

      // Try to parse the successful response
      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error("Error parsing success response:", jsonError)
        // Continue anyway since the request was successful
        result = { success: true }
      }

      console.log("Appointment created successfully:", result)

      toast({
        title: "Randevu oluşturuldu",
        description: "Randevu başarıyla oluşturuldu.",
      })

      setIsOpen(false)

      // Reset form
      setNewAppointment({
        customer_id: 0,
        service_id: 0,
        date: initialDate || new Date().toISOString().split("T")[0],
        time: "09:00",
        duration: 30,
        status: "onaylandı",
        notes: "",
      })

      // Reset search
      setPhoneSearch("")
      setShowAllCustomers(false)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating appointment:", error)
      setFormError(
        error instanceof Error ? error.message : "Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
      )

      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Randevu oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset form when dialog is closed
      setFormError("")
      setPhoneSearch("")
      setShowAllCustomers(false)
    }
    setIsOpen(open)
  }

  const handleCustomerSelect = (customerId: number) => {
    setNewAppointment((prev) => ({
      ...prev,
      customer_id: customerId,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Randevu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Randevu Ekle</DialogTitle>
          <DialogDescription>Müşteri için yeni bir randevu oluşturun.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {formError && <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">{formError}</div>}

          {/* Customer search by phone */}
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="phone-search">Müşteri Ara (Telefon)</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setShowAllCustomers(!showAllCustomers)
                  if (!showAllCustomers) {
                    setFilteredCustomers(customers)
                  } else {
                    setFilteredCustomers([])
                  }
                }}
              >
                {showAllCustomers ? "Listeyi Gizle" : "Tüm Müşterileri Göster"}
              </Button>
            </div>
            <div className="relative">
              <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone-search"
                type="text"
                placeholder="Telefon numarası ile ara..."
                className="pl-8"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
              />
            </div>

            {/* Customer list */}
            {filteredCustomers.length > 0 ? (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${
                      newAppointment.customer_id === customer.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleCustomerSelect(customer.id)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </div>
                ))}
              </div>
            ) : phoneSearch ? (
              <div className="text-sm text-gray-500 p-2 border rounded-md">
                Eşleşen müşteri bulunamadı. Lütfen farklı bir numara deneyin veya tüm müşterileri gösterin.
              </div>
            ) : null}

            {/* We don't need to show selected customer again as it's already visible in the search results */}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service">Hizmet</Label>
            <Select
              value={newAppointment.service_id ? String(newAppointment.service_id) : ""}
              onValueChange={(value) => {
                const serviceId = Number.parseInt(value)
                const service = services.find((s) => s.id === serviceId)
                setNewAppointment({
                  ...newAppointment,
                  service_id: serviceId,
                  duration: service ? service.duration : 30,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Hizmet seçin" />
              </SelectTrigger>
              <SelectContent>
                {services.length > 0 ? (
                  services.map((service) => (
                    <SelectItem key={service.id} value={String(service.id)}>
                      {service.name} - {service.price} TL ({service.duration} dk)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Hizmetler yükleniyor...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Tarih</Label>
              <Input
                id="date"
                type="date"
                value={newAppointment.date}
                onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Saat</Label>
              <Input
                id="time"
                type="time"
                value={newAppointment.time}
                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Durum</Label>
            <Select
              value={newAppointment.status}
              onValueChange={(value) => setNewAppointment({ ...newAppointment, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onaylandı">Onaylandı</SelectItem>
                <SelectItem value="beklemede">Beklemede</SelectItem>
                <SelectItem value="iptal">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notlar</Label>
            <Input
              id="notes"
              value={newAppointment.notes}
              onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
              placeholder="Randevu ile ilgili notlar..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button
            onClick={handleAddAppointment}
            disabled={isLoading || !newAppointment.customer_id || !newAppointment.service_id}
          >
            {isLoading ? "Kaydediliyor..." : "Randevu Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

