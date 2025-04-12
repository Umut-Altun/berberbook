"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calculator, CreditCard, DollarSign, Plus, Receipt, Search, ShoppingCart, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  getCustomers,
  getProducts,
  createProductSale,
  getSales,
  type Customer,
  type Product,
  type Sale,
} from "@/lib/actions"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

// Güvenli tarih formatı yardımcı fonksiyonu
// Date nesnelerinin string karşılaştırmasında sorun yaşamamak için
const formatDateSafe = (date: Date | string): string => {
  if (date instanceof Date) {
    return format(date, "yyyy-MM-dd")
  }
  // Zaten string ise olduğu gibi döndür
  return date
}

// Bugünün tarihi (formatlanmış)
const TODAY = formatDateSafe(new Date())

export default function SalesPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // New sale state
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [cart, setCart] = useState<{ productId: number; name: string; price: number; quantity: number }[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card")
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch customers
        const customersData = await getCustomers()
        setCustomers(customersData)

        // Fetch products
        const productsData = await getProducts()
        setProducts(productsData)

        // Fetch sales
        const salesData = await getSales()
        setSales(salesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Veri yükleme hatası",
          description: "Veriler yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Filter sales based on search query
  const filteredSales = sales.filter(
    (sale) =>
      sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItemIndex = cart.findIndex((item) => item.productId === product.id)

    if (existingItemIndex !== -1) {
      // Update quantity if product already in cart
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += 1
      setCart(updatedCart)
    } else {
      // Add new product to cart
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ])
    }
  }

  // Remove item from cart
  const removeFromCart = (index: number) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
  }

  // Update item quantity in cart
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return

    const newCart = [...cart]
    newCart[index].quantity = quantity
    setCart(newCart)
  }

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0 || !selectedCustomer) {
      toast({
        title: "Hata",
        description: "Lütfen bir müşteri ve en az bir ürün seçin.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)

      const customerId = Number.parseInt(selectedCustomer, 10)
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))

      const result = await createProductSale(customerId, items, paymentMethod)

      if (result.success) {
        toast({
          title: "Satış tamamlandı",
          description: "Satış başarıyla kaydedildi.",
        })

        // Reset form
        setCart([])
        setSelectedCustomer("")

        // Refresh sales
        const salesData = await getSales()
        setSales(salesData)

        // Refresh products (to update stock)
        const productsData = await getProducts()
        setProducts(productsData)
      } else {
        toast({
          title: "Hata",
          description: result.message || "Satış işlemi sırasında bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing sale:", error)
      toast({
        title: "Hata",
        description: "Satış işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Satışlar</h1>
          <p className="text-muted-foreground">Ürün satışlarını yönetin ve satış geçmişini görüntüleyin</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yeni Satış</CardTitle>
            <CardDescription>Ürünleri sepete ekleyin ve ödeme alın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Müşteri</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Müşteri adı ile ara..."
                  className="pl-8"
                  onChange={(e) => {
                    // Filter customers as user types
                    const searchTerm = e.target.value.toLowerCase()
                    if (searchTerm.length > 0) {
                      const filtered = customers.filter((customer) => customer.name.toLowerCase().includes(searchTerm))
                      setFilteredCustomers(filtered)
                    } else {
                      setFilteredCustomers([])
                    }
                  }}
                />
              </div>

              {/* Customer search results */}
              {filteredCustomers.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-2 cursor-pointer hover:bg-gray-100 ${
                        selectedCustomer === String(customer.id) ? "bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedCustomer(String(customer.id))}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected customer display */}
              {selectedCustomer && (
                <div className="bg-blue-50 p-2 rounded-md">
                  <div className="text-sm font-medium">Seçilen Müşteri:</div>
                  <div className="font-medium">
                    {customers.find((c) => String(c.id) === selectedCustomer)?.name || "Bilinmeyen Müşteri"}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Ürünler</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="col-span-2 flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className={`justify-start ${product.stock < 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => product.stock > 0 && addToCart(product)}
                      disabled={product.stock < 1}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start text-left">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.price.toFixed(2)} TL - Stok: {product.stock}
                        </span>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-muted-foreground">
                    Ürün bulunamadı. Lütfen önce ürün ekleyin.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Sepet</h3>
              {cart.length > 0 ? (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                      <span>{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="mx-2 w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <span>{(item.price * item.quantity).toFixed(2)} TL</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFromCart(index)}>
                          &times;
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Sepette ürün yok</p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Ödeme Yöntemi</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "card" | "cash")}>
                <SelectTrigger>
                  <SelectValue placeholder="Ödeme yöntemi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Kredi Kartı</SelectItem>
                  <SelectItem value="cash">Nakit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex justify-between w-full text-lg font-bold">
              <span>Toplam:</span>
              <span>{cartTotal.toFixed(2)} TL</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || !selectedCustomer || isProcessing}
              onClick={processPayment}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ödeme Al
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center">
            <div>
              <CardTitle>Satış Geçmişi</CardTitle>
              <CardDescription>Geçmiş satışları ve işlemleri görüntüleyin</CardDescription>
            </div>
            <div className="ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Satışlarda ara..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tüm Satışlar</TabsTrigger>
                <TabsTrigger value="today">Bugün</TabsTrigger>
                <TabsTrigger value="week">Bu Hafta</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <div key={sale.id} className="flex flex-col rounded-lg border p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">{sale.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{sale.date}</div>
                      </div>
                      <div className="space-y-1 mb-2">
                        {sale.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.name} {item.quantity > 1 ? `(${item.quantity}x)` : ""}
                              <span className="text-xs ml-1 text-muted-foreground">
                                {item.item_type === "product" ? "(Ürün)" : "(Hizmet)"}
                              </span>
                            </span>
                            <span>{(item.price * item.quantity).toFixed(2)} TL</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center text-sm">
                          <CreditCard className="mr-1 h-3 w-3" />
                          {sale.payment_method === "card" ? "Kredi Kartı" : "Nakit"}
                        </div>
                        <div className="font-bold">Toplam: {sale.total.toFixed(2)} TL</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">Satış bulunamadı</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="today" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredSales.filter((sale) => formatDateSafe(sale.date) === TODAY).length > 0 ? (
                  filteredSales
                    .filter((sale) => formatDateSafe(sale.date) === TODAY)
                    .map((sale) => (
                      <div key={sale.id} className="flex flex-col rounded-lg border p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{sale.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{sale.date}</div>
                        </div>
                        <div className="space-y-1 mb-2">
                          {sale.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.name} {item.quantity > 1 ? `(${item.quantity}x)` : ""}
                                <span className="text-xs ml-1 text-muted-foreground">
                                  {item.item_type === "product" ? "(Ürün)" : "(Hizmet)"}
                                </span>
                              </span>
                              <span>{(item.price * item.quantity).toFixed(2)} TL</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="flex items-center text-sm">
                            <CreditCard className="mr-1 h-3 w-3" />
                            {sale.payment_method === "card" ? "Kredi Kartı" : "Nakit"}
                          </div>
                          <div className="font-bold">Toplam: {sale.total.toFixed(2)} TL</div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">Bugün için satış bulunamadı</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="week" className="space-y-4">
                {/* Week filter would go here - simplified for this example */}
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Haftalık satış görünümü</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                setIsLoading(true)
                try {
                  const salesData = await getSales()
                  setSales(salesData)
                } catch (error) {
                  console.error("Error refreshing sales:", error)
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Satışları Yenile
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Satışlar</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">
              +{sales.filter((s) => formatDateSafe(s.date) === TODAY).length} bugün
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.reduce((total, sale) => total + sale.total, 0).toFixed(2)} TL
            </div>
            <p className="text-xs text-muted-foreground">
              +
              {sales
                .filter((s) => formatDateSafe(s.date) === TODAY)
                .reduce((total, sale) => total + sale.total, 0)
                .toFixed(2)}{" "}
              TL bugün
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Satış</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.length > 0
                ? (sales.reduce((total, sale) => total + sale.total, 0) / sales.length).toFixed(2)
                : "0.00"}{" "}
              TL
            </div>
            <p className="text-xs text-muted-foreground">Son aydan %5 artış</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Çok Satan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.length > 0
                ? (() => {
                    const itemCounts: Record<string, number> = {}
                    sales.forEach((sale) => {
                      sale.items.forEach((item) => {
                        if (!itemCounts[item.name]) itemCounts[item.name] = 0
                        itemCounts[item.name] += item.quantity
                      })
                    })
                    const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]
                    return topItem ? topItem[0] : "Yok"
                  })()
                : "Yok"}
            </div>
            <p className="text-xs text-muted-foreground">Toplam satışların %30'u</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

