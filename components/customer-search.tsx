"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CustomerSearchProps {
  onSearchChange: (query: string) => void
  defaultValue?: string
}

export default function CustomerSearch({ onSearchChange, defaultValue = "" }: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState(defaultValue)

  // Only trigger the parent's onSearchChange when the search query changes
  useEffect(() => {
    // Debounce the search to avoid too many updates
    const timer = setTimeout(() => {
      onSearchChange(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, onSearchChange])

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Müşterilerde ara..."
        className="pl-8 w-[200px] md:w-[300px]"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  )
}

