"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar, Clock, User, DollarSign, Scissors } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NewAppointmentDialog from "@/components/new-appointment-dialog"
import DynamicCalendar from "@/components/dynamic-calendar"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

// Loading skeleton for dashboard stats
function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-white shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayAppointments: { count: 0, pending: 0, confirmed: 0 },
    totalAppointments: 0,
    totalCustomers: 0,
    newCustomers: 0,
    weeklyRevenue: 0,
  })
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0]

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch dashboard stats
        const statsResponse = await fetch("/api/dashboard-stats")
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch dashboard stats: ${statsResponse.status}`)
        }
        const statsData = await statsResponse.json()

        // Fetch services
        const servicesResponse = await fetch("/api/services")
        if (!servicesResponse.ok) {
          throw new Error(`Failed to fetch services: ${servicesResponse.status}`)
        }
        const servicesData = await servicesResponse.json()

        setStats(statsData)
        setServices(servicesData.slice(0, 3)) // Just get top 3 for now
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError(err instanceof Error ? err.message : String(err))

        toast({
          title: "Veri yükleme hatası",
          description: "Gösterge paneli verileri yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  const handleAppointmentCreated = () => {
    // Refresh dashboard data when a new appointment is created
    const fetchDashboardData = async () => {
      try {
        const statsResponse = await fetch("/api/dashboard-stats")
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch dashboard stats: ${statsResponse.status}`)
        }
        const statsData = await statsResponse.json()
        setStats(statsData)
      } catch (err) {
        console.error("Error refreshing dashboard stats:", err)
      }
    }

    fetchDashboardData()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gösterge Paneli</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "MMMM yyyy", { locale: tr })} için randevularınızı yönetin
          </p>
        </div>
        <NewAppointmentDialog onSuccess={handleAppointmentCreated} initialDate={today} />
      </div>

      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : error ? (
        <div className="p-8 text-center bg-red-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-red-800">Veri Yükleme Hatası</h2>
          <p className="text-red-700">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugünkü Randevular</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAppointments.count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.todayAppointments.pending} beklemede, {stats.todayAppointments.confirmed} onaylandı
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Randevular</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">Dünden +2 artış</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Müşteriler</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">Bu hafta +{stats.newCustomers} yeni müşteri</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gelir (Bu Hafta)</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weeklyRevenue.toFixed(2)} TL</div>
              <p className="text-xs text-muted-foreground mt-1">Geçen haftadan %20 artış</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="bg-white shadow-sm border">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Takvim Görünümü
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Liste Görünümü
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="space-y-6">
          <DynamicCalendar initialDate={today} />
        </TabsContent>
        <TabsContent value="list">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-xl">Tüm Yaklaşan Randevular</CardTitle>
              <p className="text-sm text-muted-foreground">Tüm planlanmış randevuları görüntüleyin ve yönetin</p>
            </CardHeader>
            <CardContent>
              <DynamicCalendar initialDate={today} viewMode="list" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-xl">Popüler Hizmetler</CardTitle>
          <p className="text-sm text-muted-foreground">En çok tercih edilen hizmetleriniz</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center gap-3 rounded-lg border p-4 bg-gray-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">{service.price} TL</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">Henüz hizmet bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

