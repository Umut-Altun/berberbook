"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar, Clock, Edit, Trash, Plus, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Appointment, deleteAppointment, updateAppointment } from "@/lib/actions"
import NewAppointmentDialog from "./new-appointment-dialog"
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
import { useToast } from "@/components/ui/use-toast"
import PaymentDialog from "./payment-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AppointmentList({
  appointments,
  onAppointmentChange,
}: {
  appointments: Appointment[]
  onAppointmentChange?: () => void
}) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [paymentAppointment, setPaymentAppointment] = useState<Appointment | null>(null)
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null)
  const { toast } = useToast()

  // Handle deleting an appointment
  const handleDeleteAppointment = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      await deleteAppointment(deleteId)

      toast({
        title: "Randevu silindi",
        description: "Randevu başarıyla silindi.",
      })

      if (onAppointmentChange) {
        onAppointmentChange()
      }
    } catch (error) {
      console.error("Error deleting appointment:", error)

      toast({
        title: "Hata",
        description: "Randevu silinirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentAppointment(null)
    if (onAppointmentChange) {
      onAppointmentChange()
    }
  }

  return (
    <>
      <div className="space-y-4">
        {appointments.length > 0 ? (
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
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  {format(parseISO(appointment.date), "d MMM yyyy", { locale: tr })}
                  <Clock className="ml-3 mr-1 h-3 w-3" />
                  {appointment.time.slice(0, 5)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={appointment.status === "onaylandı" ? "default" : "outline"}
                  className={appointment.status === "onaylandı" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {appointment.status}
                </Badge>

                {appointment.payment_status === "paid" ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Ödendi ({appointment.payment_method === "card" ? "Kart" : "Nakit"})
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                    onClick={() => setPaymentAppointment(appointment)}
                  >
                    <CreditCard className="mr-1 h-3 w-3" />
                    Ödeme Al
                  </Button>
                )}

                <Button variant="ghost" size="icon" onClick={() => setEditAppointment(appointment)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {appointment.payment_status !== "paid" ? (
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(appointment.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" disabled className="opacity-30 cursor-not-allowed">
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Randevu bulunamadı</p>
              <NewAppointmentDialog onSuccess={onAppointmentChange}>
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="mr-2 h-4 w-4" />
                  Randevu Ekle
                </Button>
              </NewAppointmentDialog>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Randevuyu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu randevuyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {paymentAppointment && (
        <PaymentDialog
          appointment={paymentAppointment}
          onClose={() => setPaymentAppointment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
      {editAppointment && (
        <Dialog open={!!editAppointment} onOpenChange={(open) => !open && setEditAppointment(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Randevu Düzenle</DialogTitle>
              <DialogDescription>
                {editAppointment.customer_name} için randevu bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Müşteri</Label>
                <div className="p-2 bg-gray-50 rounded-md">{editAppointment.customer_name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Hizmet</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  {editAppointment.service_name} ({editAppointment.duration} dk)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={editAppointment.date}
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Saat</Label>
                  <Input
                    type="time"
                    value={editAppointment.time}
                    onChange={(e) =>
                      setEditAppointment({
                        ...editAppointment,
                        time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Durum</Label>
                <Select
                  value={editAppointment.status}
                  onValueChange={(value) =>
                    setEditAppointment({
                      ...editAppointment,
                      status: value,
                    })
                  }
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
                <Label>Notlar</Label>
                <Input
                  value={editAppointment.notes || ""}
                  onChange={(e) =>
                    setEditAppointment({
                      ...editAppointment,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Randevu ile ilgili notlar..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAppointment(null)}>
                İptal
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await updateAppointment(editAppointment.id, {
                      date: editAppointment.date,
                      time: editAppointment.time,
                      status: editAppointment.status,
                      notes: editAppointment.notes,
                    })

                    toast({
                      title: "Randevu güncellendi",
                      description: "Randevu bilgileri başarıyla güncellendi.",
                    })

                    setEditAppointment(null)

                    if (onAppointmentChange) {
                      onAppointmentChange()
                    }
                  } catch (error) {
                    console.error("Error updating appointment:", error)
                    toast({
                      title: "Hata",
                      description: "Randevu güncellenirken bir hata oluştu.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

