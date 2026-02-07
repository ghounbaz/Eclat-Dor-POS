import { useApp } from "@/Context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Barcode, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProductManagement = () => {
  const { products, setProducts } = useApp();

  const deleteProduct = (id: string) => {
    if (window.confirm("هل تريد حذف هذا المنتج نهائياً من المخزون؟")) {
      setProducts((prev: any[]) => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-rose-800 flex items-center gap-2"><Package /> إدارة المخزون</h2>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-rose-300" />
        <Input placeholder="البحث عن منتج بالاسم أو الباركود..." className="pr-10 border-rose-100 focus:ring-rose-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-rose-100 rounded-2xl bg-white/50">
            <Package className="mx-auto h-12 w-12 text-rose-100 mb-2" />
            <p className="text-gray-400 font-bold">المخزون فارغ. أضيفي فواتير شراء لتعمير المحل.</p>
          </div>
        ) : (
          products.map((product: any) => (
            <Card key={product.id} className="overflow-hidden border-rose-100 hover:shadow-md transition-all group">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Badge className="bg-rose-50 text-rose-600 border-rose-100">{product.category}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" onClick={() => deleteProduct(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <Barcode className="h-3 w-3" /> {product.barcode}
                </div>
                <div className="pt-3 border-t border-rose-50 flex justify-between items-center">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">المخزون</p>
                    <p className={`font-bold ${product.stock < 5 ? 'text-red-500' : 'text-emerald-600'}`}>{product.stock} قطعة</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">ثمن البيع</p>
                    <p className="text-xl font-black text-rose-600">{product.price} DH</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductManagement;