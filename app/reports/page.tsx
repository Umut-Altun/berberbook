"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { BarChart, Calendar, Download, LineChart, PieChart, Users, DollarSign, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getReportData } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("week")
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true)
      try {
        const data = await getReportData()
        setReportData(data)
      } catch (error) {
        console.error("Error fetching report data:", error)
        toast({
          title: "Veri yükleme hatası",
          description: "Rapor verileri yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [toast])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground">İşletmeniz için analitik ve raporları görüntüleyin</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zaman aralığı seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Bugün</SelectItem>
              <SelectItem value="week">Bu Hafta</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
              <SelectItem value="year">Bu Yıl</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="sales">Satışlar</TabsTrigger>
          <TabsTrigger value="customers">Müşteriler</TabsTrigger>
          <TabsTrigger value="services">Hizmetler</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "Yükleniyor..." : `${reportData?.monthlyRevenue.toFixed(2)} TL`}
                </div>
                <p className="text-xs text-muted-foreground">Geçen aydan %20.1 artış</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Randevular</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "Yükleniyor..." : reportData?.stats?.appointmentCount || "0"}</div>
                <p className="text-xs text-muted-foreground">Geçen aydan %12 artış</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yeni Müşteriler</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "Yükleniyor..." : reportData?.stats?.newCustomersCount || "0"}</div>
                <p className="text-xs text-muted-foreground">Geçen aydan %18 artış</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Hizmet Değeri</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading
                    ? "Yükleniyor..."
                    : `${reportData?.stats?.avgServicePrice || "0.00"} TL`}
                </div>
                <p className="text-xs text-muted-foreground">Geçen aydan %7 artış</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Gelir Dağılımı</CardTitle>
                <CardDescription>
                  Son {timeRange === "week" ? "7" : timeRange === "month" ? "30" : "365"} günlük gelir
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <LineChart className="h-16 w-16 animate-pulse text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-[300px] w-full">
                    <div className="flex items-center justify-center h-full">
                      <LineChart className="h-16 w-16 text-primary" />
                      <div className="ml-4">
                        <p className="text-sm font-medium">Gelir Grafiği</p>
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(reportData?.dailyRevenue || {})
                            .slice(0, 7)
                            .map(([date, amount]: [string, number]) => (
                              <div key={date} className="flex justify-between">
                                <span>{format(new Date(date), "d MMM", { locale: tr })}</span>
                                <span>{amount.toFixed(2)} TL</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Ödeme Yöntemi Dağılımı</CardTitle>
                <CardDescription>Ödeme yöntemlerine göre satış dağılımı</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <PieChart className="h-16 w-16 animate-pulse text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-[300px] w-full">
                    <div className="flex items-center justify-center h-full">
                      <PieChart className="h-16 w-16 text-primary" />
                      <div className="ml-4">
                        <p className="text-sm font-medium">Ödeme Yöntemi Dağılımı</p>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <p className="text-sm">Kredi Kartı: {reportData?.paymentMethods.card || 0} satış</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <p className="text-sm">Nakit: {reportData?.paymentMethods.cash || 0} satış</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Satış Analizi</CardTitle>
              <CardDescription>Satış performansının detaylı analizi</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">En Çok Satan Hizmetler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <BarChart className="h-16 w-16 animate-pulse text-muted-foreground" />
                      </div>
                    ) : reportData?.topServices.length > 0 ? (
                      <div className="space-y-4">
                        {reportData.topServices.slice(0, 5).map((service: any, index: number) => (
                          <div key={index} className="flex items-center">
                            <div className="w-8 text-sm text-muted-foreground">{index + 1}.</div>
                            <div className="flex-1">
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground">{service.count} satış</div>
                            </div>
                            <div className="font-medium">{service.revenue.toFixed(2)} TL</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        Henüz hizmet satışı yok
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">En Çok Satan Ürünler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <BarChart className="h-16 w-16 animate-pulse text-muted-foreground" />
                      </div>
                    ) : reportData?.topProducts.length > 0 ? (
                      <div className="space-y-4">
                        {reportData.topProducts.slice(0, 5).map((product: any, index: number) => (
                          <div key={index} className="flex items-center">
                            <div className="w-8 text-sm text-muted-foreground">{index + 1}.</div>
                            <div className="flex-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.count} satış</div>
                            </div>
                            <div className="font-medium">{product.revenue.toFixed(2)} TL</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        Henüz ürün satışı yok
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Analizi</CardTitle>
              <CardDescription>Müşteri sadakati ve edinme metrikleri</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[400px] w-full">
                <div className="flex items-center justify-center h-full">
                  <LineChart className="h-16 w-16 text-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium">Müşteri Analizi</p>
                    <p className="text-xs text-muted-foreground">Bu özellik yakında eklenecek</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Hizmet Performansı</CardTitle>
              <CardDescription>Hizmetlerin popülerliği ve gelir dağılımı</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Yoğun Randevu Saatleri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <Clock className="h-16 w-16 animate-pulse text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(reportData?.hourlyAppointments || {})
                          .sort(([hourA, countA], [hourB, countB]) => Number(countB) - Number(countA))
                          .slice(0, 5)
                          .map(([hour, count]: [string, number]) => (
                            <div key={hour} className="flex items-center">
                              <div className="w-16 text-sm">{hour}:00</div>
                              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{
                                    width: `${Math.min(100, (count / Math.max(...Object.values(reportData?.hourlyAppointments || {}))) * 100)}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="w-8 text-right text-sm ml-2">{count}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hizmet Gelir Dağılımı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <PieChart className="h-16 w-16 animate-pulse text-muted-foreground" />
                      </div>
                    ) : reportData?.topServices.length > 0 ? (
                      <div className="space-y-4">
                        {reportData.topServices.slice(0, 5).map((service: any, index: number) => {
                          const totalRevenue = reportData.topServices.reduce(
                            (acc: number, s: any) => acc + s.revenue,
                            0,
                          )
                          const percentage = totalRevenue > 0 ? (service.revenue / totalRevenue) * 100 : 0

                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{service.name}</span>
                                <span>{percentage.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        Henüz hizmet satışı yok
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

