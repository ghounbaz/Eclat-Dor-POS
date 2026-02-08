import { useApp } from "@/Context/AppContext";
import { supabase } from "@/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Barcode, Trash2, AlertCircle, Edit3, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ProductManagement = () => {
  const { products, fetchData } = useApp();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // حالات التعديل
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const allCategories = ["ماكياج", "عطور", "عناية بالبشرة", "عناية بالشعر", "إكسسوارات", "هدايا", "أظافر"];

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  // دالة الحذف الحقيقي من Supabase
  const deleteProduct = async (id: string) => {
    if (window.confirm("هل تريد حذف هذا المنتج نهائياً من المخزون؟ لا يمكن التراجع عن هذا الإجراء.")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        toast({ title: "تم حذف المنتج بنجاح" });
        fetchData();
      } else {
        toast({ title: "خطأ في الحذف", variant: "destructive" });
      }
    }
  };

  // دالة تحديث البيانات
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          price: editingProduct.price,
          stock: editingProduct.stock,
          image: editingProduct.image,
          category: editingProduct.category
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({ title: "تم تحديث البيانات بنجاح ✅" });
      setIsEditDialogOpen(false);
      fetchData();
    } catch (err) {
      toast({ title: "فشل التحديث", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-rose-800 flex items-center gap-2">
          <Package className="w-7 h-7" /> إدارة المخزون الحالي
        </h2>
        <Badge variant="outline" className="border-rose-200 text-rose-600 font-bold px-4 py-1">
          إجمالي المنتجات: {products.length}
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-rose-300" />
        <Input 
          placeholder="ابحثي عن منتج بالاسم أو الباركود..." 
          className="pr-10 h-12 border-rose-100 focus:ring-rose-500 rounded-xl bg-white/80 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-rose-100 rounded-3xl bg-white/50">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-200 mb-2" />
            <p className="text-gray-400 font-bold text-lg">المخزون فارغ حالياً.</p>
          </div>
        ) : (
          filteredProducts.map((product: any) => (
            <Card key={product.id} className="overflow-hidden border-rose-100 hover:shadow-xl transition-all group rounded-2xl relative">
              {/* أزرار التحكم تظهر عند الحوام (Hover) */}
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 text-rose-600 shadow-sm" onClick={() => { setEditingProduct(product); setIsEditDialogOpen(true); }}>
                  <Edit3 size={14} />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 text-red-500 shadow-sm" onClick={() => deleteProduct(product.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="aspect-square bg-gray-50 rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-rose-100" />
                  )}
                </div>

                <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold">
                  {product.category}
                </Badge>
                
                <h3 className="font-black text-lg text-gray-800 truncate">{product.name}</h3>
                
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-gray-50 p-1 rounded">
                  <Barcode className="h-3 w-3" /> {product.barcode}
                </div>

                <div className="pt-3 border-t border-rose-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">المخزون</p>
                    <p className={`font-black text-lg ${product.stock < 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {product.stock} <span className="text-xs">قطعة</span>
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">ثمن البيع</p>
                    <p className="text-xl font-black text-rose-600">{product.price} <span className="text-xs">DH</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* نافذة التعديل */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-md p-8" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-rose-900 italic flex items-center gap-2">
              <Edit3 className="text-rose-600" /> تعديل بيانات المنتج
            </DialogTitle>
          </DialogHeader>
          
          {editingProduct && (
            <form onSubmit={handleUpdate} className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold mr-2">اسم المنتج</Label>
                <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="rounded-xl h-12" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold mr-2 text-emerald-600">ثمن البيع (DH)</Label>
                  <Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="rounded-xl h-12" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold mr-2 text-blue-600">الكمية (Stock)</Label>
                  <Input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="rounded-xl h-12" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold mr-2 flex items-center gap-1"><ImageIcon size={14}/> رابط الصورة</Label>
                <Input value={editingProduct.image || ""} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="rounded-xl h-12" placeholder="https://..." />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold mr-2">الفئة</Label>
                <Select value={editingProduct.category} onValueChange={(v) => setEditingProduct({...editingProduct, category: v})}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 h-14 rounded-2xl font-black text-lg text-white shadow-lg mt-4 transition-transform active:scale-95">
                تأكيد التعديلات ✅
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;