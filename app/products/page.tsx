"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProduct, updateProduct, deleteProduct, getProducts, type Product } from "@/lib/actions"
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

const productCategories = ["Şampuan", "Saç Kremi", "Saç Şekillendirici", "Sakal Bakımı", "Cilt Bakımı", "Diğer"]

export default function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formError, setFormError] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Diğer",
    price: 0,
    stock: 0,
    description: "",
  })

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Function to fetch products
  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Veri yükleme hatası",
        description: "Ürünler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Validate form
  const validateForm = (product: typeof newProduct) => {
    if (!product.name.trim()) {
      setFormError("Ürün adı gereklidir")
      return false
    }

    if (product.price < 0) {
      setFormError("Fiyat 0 veya daha büyük olmalıdır")
      return false
    }

    if (product.stock < 0) {
      setFormError("Stok 0 veya daha büyük olmalıdır")
      return false
    }

    setFormError("")
    return true
  }

  const handleAddProduct = async () => {
    if (!validateForm(newProduct)) return

    try {
      setIsLoading(true)

      const result = await createProduct(newProduct)

      toast({
        title: "Ürün eklendi",
        description: `${newProduct.name} başarıyla eklendi.`,
      })

      setIsAddingProduct(false)
      setNewProduct({
        name: "",
        category: "Diğer",
        price: 0,
        stock: 0,
        description: "",
      })

      // Refresh products
      fetchProducts()
    } catch (error) {
      console.error("Error adding product:", error)
      setFormError("Ürün eklenirken bir hata oluştu. Lütfen tekrar deneyin.")

      toast({
        title: "Hata",
        description: "Ürün eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return
    if (!validateForm(editingProduct)) return

    try {
      setIsLoading(true)

      const result = await updateProduct(editingProduct.id, editingProduct)

      if (result.success === false) {
        setFormError(result.message || "Ürün güncellenirken bir hata oluştu.")
        toast({
          title: "Hata",
          description: result.message || "Ürün güncellenirken bir hata oluştu.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Ürün güncellendi",
        description: `${editingProduct.name} başarıyla güncellendi.`,
      })

      setIsEditingProduct(false)
      setEditingProduct(null)

      // Refresh products
      fetchProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      setFormError("Ürün güncellenirken bir hata oluştu. Lütfen tekrar deneyin.")

      toast({
        title: "Hata",
        description: "Ürün güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      const result = await deleteProduct(deleteId)

      if (result.success) {
        toast({
          title: "Ürün silindi",
          description: result.message || "Ürün başarıyla silindi.",
        })

        setDeleteId(null)

        // Refresh products
        fetchProducts()
      } else {
        console.warn("Product deletion failed:", result.message)
        toast({
          title: "Ürün silinemedi",
          description: result.message || "Ürün silinirken bir hata oluştu.",
          variant: "destructive",
        })

        setDeleteId(null)
        fetchProducts()
      }
    } catch (error) {
      console.error("Error deleting product:", error)

      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu.",
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
          <h1 className="text-2xl font-bold tracking-tight">Ürünler</h1>
          <p className="text-muted-foreground">Berber dükkanınızda satılan ürünleri yönetin</p>
        </div>
        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ürün
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Ürün Ekle</DialogTitle>
              <DialogDescription>Berber dükkanınıza yeni bir ürün ekleyin.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formError && <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">{formError}</div>}
              <div className="grid gap-2">
                <Label htmlFor="name">Ürün Adı</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Saç Jölesi"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Fiyat (TL)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={String(newProduct.price || "")}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        price: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="25"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stok</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={String(newProduct.stock || "")}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Ürün açıklaması"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingProduct(false)} disabled={isLoading}>
                İptal
              </Button>
              <Button onClick={handleAddProduct} disabled={isLoading}>
                {isLoading ? "Kaydediliyor..." : "Ürün Ekle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center">
          <div>
            <CardTitle>Ürün Listesi</CardTitle>
            <CardDescription>Berber dükkanınızda satılan ürünleri yönetin</CardDescription>
          </div>
          <div className="ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ürünlerde ara..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && products.length === 0 ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.description}</TableCell>
                      <TableCell>{(typeof product.price === 'number' ? product.price : Number(product.price)).toFixed(2)} TL</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingProduct(product)
                              setIsEditingProduct(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(product.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchQuery ? "Arama kriterlerine uygun ürün bulunamadı." : "Ürün bulunamadı."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={fetchProducts} disabled={isLoading}>
            {isLoading ? "Yükleniyor..." : "Ürünleri Yenile"}
          </Button>
          <Button onClick={() => setIsAddingProduct(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ürün
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditingProduct} onOpenChange={setIsEditingProduct}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ürün Düzenle</DialogTitle>
            <DialogDescription>Ürün bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              {formError && <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">{formError}</div>}
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Ürün Adı</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Saç Jölesi"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Kategori</Label>
                <Select
                  value={editingProduct.category}
                  onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Fiyat (TL)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={String(editingProduct.price || "")}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="25"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stok</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={String(editingProduct.stock || "")}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Açıklama</Label>
                <Input
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Ürün açıklaması"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProduct(false)} disabled={isLoading}>
              İptal
            </Button>
            <Button onClick={handleEditProduct} disabled={isLoading}>
              {isLoading ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

