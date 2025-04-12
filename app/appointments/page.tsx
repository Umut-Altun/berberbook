"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Plus, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import NewAppointmentDialog from "@/components/new-appointment-dialog"
import AppointmentList from "@/components/appointment-list"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import type { Appointment } from "@/lib/actions"

// Loading skeleton for appointments
function AppointmentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { toast } = useToast()

  // Function to fetch all appointments
  const fetchAllAppointments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/appointments?t=${timestamp}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to fetch appointments: ${response.status} ${errorData.message || ""}`)
      }

      const data = await response.json()
      setAppointments(data)
    } catch (err) {
      console.error("Error fetching appointments:", err)
      setError(err instanceof Error ? err.message : String(err))
      toast({
        title: "Veri yükleme hatası",
        description: err instanceof Error ? err.message : "Randevular yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to fetch appointments for a specific date
  const fetchAppointmentsByDate = async (date: Date) => {
    setIsLoading(true)
    setError(null)
    try {
      const dateString = format(date, "yyyy-MM-dd")
      const timestamp = Date.now()
      const response = await fetch(`/api/appointments?date=${dateString}&t=${timestamp}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to fetch appointments: ${response.status} ${errorData.message || ""}`)
      }

      const data = await response.json()
      setAppointments(data)
    } catch (err) {
      console.error("Error fetching appointments by date:", err)
      setError(err instanceof Error ? err.message : String(err))
      toast({
        title: "Veri yükleme hatası",
        description: err instanceof Error ? err.message : "Randevular yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch of all appointments
  useEffect(() => {
    fetchAllAppointments()
  }, [])

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      fetchAppointmentsByDate(date)
    } else {
      fetchAllAppointments()
    }
  }

  // Filter appointments based on search query
  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.service_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAppointmentAdded = () => {
    // Fetch appointments again when a new appointment is added
    if (selectedDate) {
      fetchAppointmentsByDate(selectedDate)
    } else {
      fetchAllAppointments()
    }

    // Add a small delay to ensure the database has updated
    setTimeout(() => {
      if (selectedDate) {
        fetchAppointmentsByDate(selectedDate)
      } else {
        fetchAllAppointments()
      }
    }, 500)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Randevular</h1>
          <p className="text-muted-foreground mt-1">Müşterileriniz için randevuları yönetin ve planlayın</p>
        </div>
        <NewAppointmentDialog
          onSuccess={handleAppointmentAdded}
          initialDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Takvim</CardTitle>
              <CardDescription>Randevuları görüntülemek için bir tarih seçin</CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                locale={tr}
              />
              {selectedDate && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm font-medium">
                    Seçili tarih: {format(selectedDate, "d MMMM yyyy", { locale: tr })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(undefined)
                      fetchAllAppointments()
                    }}
                  >
                    Tüm Randevuları Göster
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="md:w-2/3">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="flex flex-row items-center">
              <div>
                <CardTitle>Randevular</CardTitle>
                <CardDescription>
                  {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : "Tüm randevular"}
                </CardDescription>
              </div>
              <div className="ml-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Randevularda ara..."
                    className="pl-8 w-[200px] md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 bg-gray-100">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    Tümü
                  </TabsTrigger>
                  <TabsTrigger
                    value="confirmed"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Onaylanan
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Bekleyen
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  {isLoading ? (
                    <AppointmentsSkeleton />
                  ) : error ? (
                    <div className="p-8 text-center bg-red-50 rounded-lg">
                      <h2 className="text-xl font-semibold mb-4 text-red-800">Veri Yükleme Hatası</h2>
                      <p className="text-red-700">{error}</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => (selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments())}
                      >
                        Tekrar Dene
                      </Button>
                    </div>
                  ) : (
                    <AppointmentList
                      appointments={filteredAppointments}
                      onAppointmentChange={() =>
                        selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments()
                      }
                    />
                  )}
                </TabsContent>
                <TabsContent value="confirmed">
                  {isLoading ? (
                    <AppointmentsSkeleton />
                  ) : (
                    <AppointmentList
                      appointments={filteredAppointments.filter((a) => a.status === "onaylandı")}
                      onAppointmentChange={() =>
                        selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments()
                      }
                    />
                  )}
                </TabsContent>
                <TabsContent value="pending">
                  {isLoading ? (
                    <AppointmentsSkeleton />
                  ) : (
                    <AppointmentList
                      appointments={filteredAppointments.filter((a) => a.status === "beklemede")}
                      onAppointmentChange={() =>
                        selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments()
                      }
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => (selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments())}
                disabled={isLoading}
              >
                {isLoading ? "Yükleniyor..." : "Randevuları Yenile"}
              </Button>
              <NewAppointmentDialog
                onSuccess={handleAppointmentAdded}
                initialDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
              >
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Randevu
                </Button>
              </NewAppointmentDialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

