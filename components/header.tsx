"use client"

import { useState } from "react"
import { Bell, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NewAppointmentDialog from "@/components/new-appointment-dialog"
import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter()

  const handleAppointmentCreated = () => {
    // Refresh the page or update the UI as needed
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 shadow-sm">
      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <NewAppointmentDialog onSuccess={handleAppointmentCreated}>
            <Button className="bg-primary hover:bg-primary/90 px-2 md:px-4 rounded-md">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline-block ml-2">Yeni Randevu</span>
            </Button>
          </NewAppointmentDialog>

          <Button variant="outline" size="icon" className="relative rounded-md border-gray-200 hover:bg-gray-100 hover:text-primary">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              3
            </span>
            <span className="sr-only">Bildirimler</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt="Kullanıcı" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border border-gray-200 shadow-md">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 hover:text-primary">Profil</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 hover:text-primary">Ayarlar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 hover:text-primary">Çıkış Yap</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

