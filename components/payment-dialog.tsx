"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { type Appointment, type Service, processAppointmentPayment, getServices } from "@/lib/actions"
import { Loader2, Check } from "lucide-react"

export default function PaymentDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<number>(appointment.service_id)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card")
  const [isLoadingServices, setIsLoadingServices] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getServices()
        setServices(servicesData)
        setIsLoadingServices(false)
      } catch (error) {
        console.error("Error fetching services:", error)
        toast({
          title: "Hata",
          description: "Hizmetler yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
        setIsLoadingServices(false)
      }
    }

    fetchServices()
  }, [toast])

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      const result = await processAppointmentPayment(appointment.id, paymentMethod)

      if (result.success) {
        toast({
          title: "Ödeme alındı",
          description: "Ödeme başarıyla alındı.",
        })
        onSuccess()
      } else {
        toast({
          title: "Hata",
          description: result.message || "Ödeme işlemi sırasında bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Hata",
        description: "Ödeme işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedServiceDetails = services.find((s) => s.id === selectedService)

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ödeme Al</DialogTitle>
          <DialogDescription>{appointment.customer_name} için ödeme alın.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Hizmet</Label>
            {isLoadingServices ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer border ${
                      selectedService === service.id ? "bg-primary/10 border-primary" : "bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className="flex items-center gap-2">
                      {selectedService === service.id && <Check className="h-4 w-4 text-primary" />}
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">{service.duration} dk</div>
                      </div>
                    </div>
                    <div className="font-medium">{Number(service.price).toFixed(2)} TL</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Ödeme Yöntemi</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "card" | "cash")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="cursor-pointer">
                  Kredi Kartı
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="cursor-pointer">
                  Nakit
                </Label>
              </div>
            </RadioGroup>
          </div>

          {selectedServiceDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between mb-2">
                <span>Hizmet:</span>
                <span>{selectedServiceDetails.name}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Toplam:</span>
                <span>{Number(selectedServiceDetails.price).toFixed(2)} TL</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            İptal
          </Button>
          <Button onClick={handlePayment} disabled={isLoading || !selectedService}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : (
              "Ödemeyi Tamamla"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

