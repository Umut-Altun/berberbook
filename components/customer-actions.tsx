"use client"

import { useState } from "react"
import { Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Customer, deleteCustomer, updateCustomer } from "@/lib/actions"
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

export default function CustomerActions({
  customer,
  onSuccess,
}: {
  customer: Customer
  onSuccess?: () => void
}) {
  const { toast } = useToast()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const [editedCustomer, setEditedCustomer] = useState({
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
  })

  const validateForm = () => {
    if (!editedCustomer.name.trim()) {
      setFormError("Müşteri adı gereklidir")
      return false
    }

    if (editedCustomer.phone && !/^[0-9\-+\s$$$$]{7,15}$/.test(editedCustomer.phone)) {
      setFormError("Geçerli bir telefon numarası giriniz")
      return false
    }

    if (editedCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedCustomer.email)) {
      setFormError("Geçerli bir e-posta adresi giriniz")
      return false
    }

    setFormError("")
    return true
  }

  const handleUpdateCustomer = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)
      const result = await updateCustomer(customer.id, editedCustomer)

      if (result.success === false) {
        // Handle the case where update failed
        setFormError(result.message || "Müşteri güncellenirken bir hata oluştu.")
        toast({
          title: "Hata",
          description: result.message || "Müşteri güncellenirken bir hata oluştu.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Müşteri güncellendi",
        description: `${editedCustomer.name} başarıyla güncellendi.`,
      })

      setIsEditOpen(false)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error updating customer:", error)
      setFormError("Müşteri güncellenirken bir hata oluştu.")

      toast({
        title: "Hata",
        description: "Müşteri güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCustomer = async () => {
    try {
      setIsLoading(true)
      const result = await deleteCustomer(customer.id)

      if (result.success) {
        toast({
          title: "Müşteri silindi",
          description: result.message || `${customer.name} başarıyla silindi.`,
        })

        setIsDeleteOpen(false)

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        // Handle the case where deletion failed but didn't throw an error
        console.warn("Customer deletion failed:", result.message)
        toast({
          title: "Müşteri silinemedi",
          description: result.message || "Müşteri silinirken bir hata oluştu.",
          variant: "destructive",
        })
        
        // Close the dialog anyway since the customer might not exist
        setIsDeleteOpen(false)
        
        // Still refresh the list to ensure UI is in sync with backend
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      console.error("Error deleting customer:", error)

      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Müşteri silinirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditDialogChange = (open: boolean) => {
    if (!open) {
      // Reset form when dialog is closed
      setEditedCustomer({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      })
      setFormError("")
    }
    setIsEditOpen(open)
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(true)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setIsDeleteOpen(true)}>
        <Trash className="h-4 w-4" />
      </Button>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Müşteri Düzenle</DialogTitle>
            <DialogDescription>Müşteri bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {formError && <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">{formError}</div>}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                Ad Soyad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editedCustomer.name}
                onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefon Numarası</Label>
              <Input
                id="edit-phone"
                value={editedCustomer.phone}
                onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-posta Adresi</Label>
              <Input
                id="edit-email"
                type="email"
                value={editedCustomer.email}
                onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
              İptal
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={isLoading}>
              {isLoading ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm randevuları da
              silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isLoading ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

