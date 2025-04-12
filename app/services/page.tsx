"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash, Scissors } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createService, updateService, deleteService, type Service, getServices } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingService, setIsAddingService] = useState(false)
  const [isEditingService, setIsEditingService] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formError, setFormError] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Find the newService state initialization and ensure default values are properly set
  const [newService, setNewService] = useState({
    name: "",
    duration: 30,
    price: 0,
    description: "",
  })

  const [editingService, setEditingService] = useState<Service | null>(null)

  // Fetch services on mount
  useEffect(() => {
    fetchServices()
  }, [])

  // Function to fetch services
  const fetchServices = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching services using server actions...")
      const servicesData = await getServices()
      console.log(`Fetched ${servicesData.length} services successfully`)
      setServices(servicesData)
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Veri yükleme hatası",
        description: "Hizmetler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter services based on search query
  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Validate form
  const validateForm = (service: typeof newService) => {
    if (!service.name.trim()) {
      setFormError("Hizmet adı gereklidir")
      return false
    }

    if (service.duration <= 0) {
      setFormError("Süre 0'dan büyük olmalıdır")
      return false
    }

    if (service.price < 0) {
      setFormError("Fiyat 0 veya daha büyük olmalıdır")
      return false
    }

    setFormError("")
    return true
  }

  // Find the handleAddService function and ensure numeric values are properly parsed
  const handleAddService = async () => {
    if (!validateForm(newService)) return

    try {
      setIsLoading(true)
      console.log("Creating new service:", newService)

      // Ensure numeric values are properly parsed
      const serviceToCreate = {
        ...newService,
        duration: Number(newService.duration) || 30, // Default to 30 if NaN
        price: Number(newService.price) || 0, // Default to 0 if NaN
      }

      const result = await createService(serviceToCreate)
      console.log("Service created successfully:", result)

      toast({
        title: "Hizmet eklendi",
        description: `${newService.name} başarıyla eklendi.`,
      })

      setIsAddingService(false)
      setNewService({
        name: "",
        duration: 30,
        price: 0,
        description: "",
      })

      // Refresh services with a delay to ensure the database has updated
      setTimeout(() => {
        console.log("Refreshing services after adding new service...")
        fetchServices()
      }, 1000)
    } catch (error) {
      console.error("Error adding service:", error)
      setFormError("Hizmet eklenirken bir hata oluştu. Lütfen tekrar deneyin.")

      toast({
        title: "Hata",
        description: "Hizmet eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Find the handleEditService function and ensure numeric values are properly parsed
  const handleEditService = async () => {
    if (!editingService) return
    if (!validateForm(editingService)) return

    try {
      setIsLoading(true)

      // Ensure numeric values are properly parsed
      const serviceToUpdate = {
        ...editingService,
        duration: Number(editingService.duration) || 30, // Default to 30 if NaN
        price: Number(editingService.price) || 0, // Default to 0 if NaN
      }

      const result = await updateService(serviceToUpdate.id, serviceToUpdate)

      if (result.success === false) {
        setFormError(result.message || "Hizmet güncellenirken bir hata oluştu.")
        toast({
          title: "Hata",
          description: result.message || "Hizmet güncellenirken bir hata oluştu.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Hizmet güncellendi",
        description: `${editingService.name} başarıyla güncellendi.`,
      })

      setIsEditingService(false)
      setEditingService(null)

      // Refresh services
      fetchServices()
    } catch (error) {
      console.error("Error updating service:", error)
      setFormError("Hizmet güncellenirken bir hata oluştu. Lütfen tekrar deneyin.")

      toast({
        title: "Hata",
        description: "Hizmet güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle deleting a service
  const handleDeleteService = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      const result = await deleteService(deleteId)

      if (result.success) {
        toast({
          title: "Hizmet silindi",
          description: result.message || "Hizmet başarıyla silindi.",
        })

        setDeleteId(null)

        // Refresh services
        fetchServices()
      } else {
        // Handle the case where deletion failed but didn't throw an error
        console.warn("Service deletion failed:", result.message)
        toast({
          title: "Hizmet silinemedi",
          description: result.message || "Hizmet silinirken bir hata oluştu.",
          variant: "destructive",
        })

        // Close the dialog anyway since the service might not exist
        setDeleteId(null)

        // Still refresh the list to ensure UI is in sync with backend
        fetchServices()
      }
    } catch (error) {
      console.error("Error deleting service:", error)

      toast({
        title: "Hata",
        description: "Hizmet silinirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hizmetler</h1>
          <p className="text-muted-foreground">Hizmet sunumlarınızı ve fiyatlandırmanızı yönetin</p>
        </div>
        <Dialog open={isAddingService} onOpenChange={setIsAddingService}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Hizmet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Hizmet Ekle</DialogTitle>
              <DialogDescription>Sunumlarınıza yeni bir hizmet ekleyin.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formError && <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">{formError}</div>}
              <div className="grid gap-2">
                <Label htmlFor="name">Hizmet Adı</Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Saç Kesimi"
                />
              </div>
              {/* Find the input fields for duration and price in the "Add Service" dialog and ensure they handle NaN */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Süre (dakika)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={String(newService.duration || "")}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        duration: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Fiyat (TL)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={String(newService.price || "")}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        price: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="25"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Hizmet açıklaması"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingService(false)} disabled={isLoading}>
                İptal
              </Button>
              <Button onClick={handleAddService} disabled={isLoading}>
                {isLoading ? "Kaydediliyor..." : "Hizmet Ekle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center">
          <div>
            <CardTitle>Hizmet Menüsü</CardTitle>
            <CardDescription>Hizmet sunumlarınızı ve fiyatlandırmanızı yönetin</CardDescription>
          </div>
          <div className="ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Hizmetlerde ara..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && services.length === 0 ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hizmet</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>{service.duration} dk</TableCell>
                      <TableCell>{Number(service.price).toFixed(2)} TL</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingService(service)
                              setIsEditingService(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(service.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {searchQuery ? "Arama kriterlerine uygun hizmet bulunamadı." : "Hizmet bulunamadı."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={fetchServices} disabled={isLoading}>
            {isLoading ? "Yükleniyor..." : "Hizmetleri Yenile"}
          </Button>
          <Button onClick={() => setIsAddingService(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hizmet
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={isEditingService} onOpenChange={setIsEditingService}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Hizmet Düzenle</DialogTitle>
            <DialogDescription>Hizmet bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>
          {/* Find the input fields for duration and price in the "Edit Service" dialog and ensure they handle NaN */}
          {editingService && (
            <div className="grid gap-4 py-4">
              {formError && <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">{formError}</div>}
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Hizmet Adı</Label>
                <Input
                  id="edit-name"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="Saç Kesimi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration">Süre (dakika)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={String(editingService.duration || "")}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        duration: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Fiyat (TL)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={String(editingService.price || "")}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="25"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Açıklama</Label>
                <Input
                  id="edit-description"
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Hizmet açıklaması"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingService(false)} disabled={isLoading}>
              İptal
            </Button>
            <Button onClick={handleEditService} disabled={isLoading}>
              {isLoading ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hizmeti Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu hizmeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Hizmetler</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">+{services.length > 0 ? 1 : 0} yeni hizmet bu ay</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Fiyat</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.length > 0
                ? (services.reduce((acc, service) => acc + Number(service.price), 0) / services.length).toFixed(2)
                : "0.00"}{" "}
              TL
            </div>
            <p className="text-xs text-muted-foreground">+5% son güncellemeden</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Popüler</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length > 0 ? services[0].name : "Yok"}</div>
            <p className="text-xs text-muted-foreground">Tüm randevuların %42'si</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

