"use client"

import { useEffect, useState } from "react"
import { isLocalStorageAvailable, clearAllData } from "@/lib/local-storage"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw, Trash2 } from "lucide-react"
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

export default function LocalStorageProvider() {
  const [status, setStatus] = useState<"loading" | "available" | "unavailable">("loading")
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if localStorage is available
    const available = isLocalStorageAvailable()
    setStatus(available ? "available" : "unavailable")
  }, [])

  const handleReset = async () => {
    setIsResetting(true)
    try {
      clearAllData()
      toast({
        title: "Veri Sıfırlandı",
        description: "Tüm veriler başarıyla sıfırlandı. Sayfa yenileniyor...",
      })

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error resetting data:", error)
      toast({
        title: "Hata",
        description: "Veriler sıfırlanırken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
      setShowResetConfirm(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-md border p-2 text-sm bg-white shadow-sm">
        {status === "loading" && (
          <>
            <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
            <span className="text-yellow-500">Yerel depolama kontrol ediliyor...</span>
          </>
        )}

        {status === "available" && (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-500">Yerel depolama kullanılabilir</span>
          </>
        )}

        {status === "unavailable" && (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">Yerel depolama kullanılamıyor</span>
          </>
        )}

        <div className="flex ml-2 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting || status !== "available"}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {isResetting ? "Sıfırlanıyor..." : "Verileri Sıfırla"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verileri Sıfırla</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem TÜM verileri silecek ve uygulamayı boş bir duruma getirecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={isResetting} className="bg-red-500 hover:bg-red-600">
              {isResetting ? "Sıfırlanıyor..." : "Verileri Sıfırla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

