"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns"
import { tr } from "date-fns/locale"
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import NewAppointmentDialog from "@/components/new-appointment-dialog"
import { useToast } from "@/components/ui/use-toast"
import type { Appointment } from "@/lib/actions"

export default function DynamicCalendar({
  initialDate,
  viewMode = "calendar",
}: {
  initialDate: string
  viewMode?: "calendar" | "list"
}) {
  const [selectedDate, setSelectedDate] = useState(new Date(initialDate))
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 1 }))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Fetch appointments for the selected date
  const fetchAppointments = async (date: Date) => {
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

  // Fetch appointments when the selected date changes
  useEffect(() => {
    fetchAppointments(selectedDate)
  }, [selectedDate])

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setWeekStart(subWeeks(weekStart, 1))
  }

  // Navigate to next week
  const goToNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1))
  }

  // Handle day selection
  const handleDaySelect = (day: Date) => {
    setSelectedDate(day)
  }

  // Handle appointment created
  const handleAppointmentCreated = () => {
    // Refresh appointments for the selected date
    fetchAppointments(selectedDate)
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Veri Yükleme Hatası</h2>
            <p className="text-red-700">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => fetchAppointments(selectedDate)}>
              Tekrar Dene
            </Button>
          </div>
        ) : appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between rounded-lg border p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="space-y-1">
                <div className="font-medium">{appointment.customer_name}</div>
                <div className="text-sm text-muted-foreground">
                  {appointment.service_name} ({appointment.duration} dk)
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-right">
                  <div>{format(parseISO(appointment.date), "d MMM yyyy", { locale: tr })}</div>
                  <div>{appointment.time.slice(0, 5)}</div>
                </div>
                <Badge
                  variant={appointment.status === "onaylandı" ? "default" : "outline"}
                  className={appointment.status === "onaylandı" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {appointment.status}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Randevu bulunamadı</p>
              <NewAppointmentDialog
                onSuccess={handleAppointmentCreated}
                initialDate={format(selectedDate, "yyyy-MM-dd")}
              >
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="mr-2 h-4 w-4" />
                  Randevu Ekle
                </Button>
              </NewAppointmentDialog>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {format(weekStart, "d MMM", { locale: tr })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: tr })}
        </div>
        <Button variant="outline" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-3 overflow-x-auto pb-2">
        {weekDays.map((day) => (
          <Button
            key={day.toString()}
            variant={isSameDay(day, selectedDate) ? "default" : "outline"}
            className={`h-auto flex flex-col p-3 ${
              isSameDay(day, selectedDate) ? "bg-primary text-white" : "bg-white"
            }`}
            onClick={() => handleDaySelect(day)}
          >
            <div className="text-xs font-medium">{format(day, "EEE", { locale: tr })}</div>
            <div className="text-lg">{format(day, "d")}</div>
          </Button>
        ))}
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-xl">{format(selectedDate, "EEEE, d MMMM yyyy", { locale: tr })}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Randevular yükleniyor..." : `${appointments.length} randevu planlandı`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-8 text-center bg-red-50 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-red-800">Veri Yükleme Hatası</h2>
                <p className="text-red-700">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => fetchAppointments(selectedDate)}>
                  Tekrar Dene
                </Button>
              </div>
            ) : appointments.length > 0 ? (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-lg border p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{appointment.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.service_name} ({appointment.duration} dk)
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{appointment.time.slice(0, 5)}</div>
                    <Badge
                      variant={appointment.status === "onaylandı" ? "default" : "outline"}
                      className={appointment.status === "onaylandı" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-gray-50">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Bu gün için randevu bulunmuyor</p>
                  <NewAppointmentDialog
                    onSuccess={handleAppointmentCreated}
                    initialDate={format(selectedDate, "yyyy-MM-dd")}
                  >
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="mr-2 h-4 w-4" />
                      Randevu Ekle
                    </Button>
                  </NewAppointmentDialog>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

