"use client"

import type React from "react"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCustomer } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"

export default function NewCustomerDialog({
  children,
  onSuccess,
}: {
  children?: React.ReactNode
  onSuccess?: () => void
}) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  })

  const validateForm = () => {
    if (!newCustomer.name.trim()) {
      setFormError("Müşteri adı gereklidir")
      return false
    }

    if (newCustomer.phone && !/^[0-9\-+\s$$$$]{7,15}$/.test(newCustomer.phone)) {
      setFormError("Geçerli bir telefon numarası giriniz")
      return false
    }

    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      setFormError("Geçerli bir e-posta adresi giriniz")
      return false
    }

    setFormError("")
    return true
  }

  const handleAddCustomer = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)
      console.log("Creating new customer:", newCustomer)

      const result = await createCustomer(newCustomer)
      console.log("Customer created successfully:", result)

      toast({
        title: "Müşteri eklendi",
        description: `${newCustomer.name} başarıyla eklendi.`,
      })

      setIsOpen(false)
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
      })

      // Call onSuccess callback if provided
      console.log("Calling onSuccess callback to refresh customer list")
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1000) // Daha uzun bir gecikme ile callback'i çağıralım
      }
    } catch (error) {
      console.error("Error creating customer:", error)
      setFormError("Müşteri eklenirken bir hata oluştu. Lütfen tekrar deneyin.")

      toast({
        title: "Hata",
        description: "Müşteri eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset form when dialog is closed
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
      })
      setFormError("")
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
          <DialogDescription>Veritabanınıza yeni bir müşteri ekleyin.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {formError && <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">{formError}</div>}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Ad Soyad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              placeholder="Ahmet Yılmaz"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefon Numarası</Label>
            <Input
              id="phone"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="555-1234"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-posta Adresi</Label>
            <Input
              id="email"
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              placeholder="ahmet@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            İptal
          </Button>
          <Button onClick={handleAddCustomer} disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : "Müşteri Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

