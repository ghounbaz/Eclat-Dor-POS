import { useState, useEffect } from "react";
import { useApp } from "@/Context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Sparkles, CheckCircle2, Barcode, Printer, Plus, Minus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SalesInterface = () => {
  const { products, setProducts, setInvoices } = useApp();
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // دالة إضافة المنتج مع مراقبة المخزون الصارمة
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQtyInCart = existing ? existing.quantity : 0;

      // التأكد من أن الكمية المطلوبة لا تتجاوز المتوفر في المخزون
      if (currentQtyInCart >= product.stock) {
        toast({ 
          title: "المخزون غير كافي", 
          description: `المتوفر فقط ${product.stock} قطع من ${product.name}`,
          variant: "destructive" 
        });
        return prev;
      }

      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
    ).filter(item => item.quantity > 0));
  };

  // مراقبة سكان الباركود
  useEffect(() => {
    const scannedProduct = products.find((p: any) => p.barcode === search && p.barcode !== "");
    if (scannedProduct) {
      addToCart(scannedProduct);
      setSearch("");
    }
  }, [search, products]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePrint = () => {
    if (cart.length === 0) return;
    window.print();
  };

  const handleConfirmSale = () => {
    if (cart.length === 0) return;
    
    // تحديث المخزون الحقيقي بعد التأكيد
    setProducts((prev: any[]) => prev.map(p => {
      const item = cart.find(i => i.id === p.id);
      return item ? { ...p, stock: p.stock - item.quantity } : p;
    }));

    setInvoices((prev: any) => [{
      id: "SALE-" + Date.now(),
      date: new Date().toLocaleString(),
      items: cart,
      total: subtotal,
      type: 'sale'
    }, ...prev]);

    toast({ title: "تم تسجيل البيع وتحديث المخزون" });
    setCart([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* واجهة العرض والبحث */}
      <div className="lg:col-span-8 space-y-6 print:hidden">
        <div className="relative">
          <Barcode className="absolute right-4 top-4 text-amber-500 w-6 h-6" />
          <Input 
            autoFocus 
            placeholder="سكاني الباركود بالدوشيت هنا..." 
            className="h-16 rounded-[1.5rem] border-2 border-amber-200 pr-14 text-xl shadow-lg" 
            value={search} 
            onChange={(e)=>setSearch(e.target.value)} 
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.filter((p:any) => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
            <Card key={product.id} className="cursor-pointer hover:border-amber-400 rounded-[2rem] overflow-hidden bg-white shadow-sm transition-all" onClick={() => addToCart(product)}>
              <div className="h-40 bg-amber-50 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : ( <Sparkles className="text-amber-200 w-10 h-10" /> )}
              </div>
              <CardContent className="p-3 text-center">
                <h3 className="font-black text-gray-800 truncate text-sm uppercase">{product.name}</h3>
                <Badge className="bg-amber-600 text-white font-black mt-1">{product.price} DH</Badge>
                <p className="text-[10px] mt-1 text-amber-500 font-bold italic">متوفر: {product.stock} حبة</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* سلة الزبونة مع تفاصيل المخزون */}
      <Card className="lg:col-span-4 border-amber-200 shadow-2xl rounded-[2.5rem] flex flex-col h-[85vh] bg-white overflow-hidden border-2 printable-area">
        <CardHeader className="bg-amber-600 text-white p-6 flex justify-between items-center print:bg-white print:text-black print:border-b-2">
          <CardTitle className="italic font-black text-2xl">Eclat D'or</CardTitle>
          <Button variant="ghost" onClick={() => setCart([])} className="no-print text-amber-100 hover:text-white"><Trash2 size={20}/></Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-amber-50/50 p-4 rounded-[1.5rem] border border-amber-100 flex justify-between items-center print:border-b">
              <div className="flex-1">
                <p className="font-black text-amber-900 text-sm print:text-lg">{item.name}</p>
                
                {/* إظهار المخزون المتبقي لكل سلعة في السلة */}
                <p className="text-[9px] text-amber-600 font-bold no-print italic">
                  أقصى حد متوفر: {item.stock} حبة
                </p>

                <div className="flex items-center gap-3 mt-1 no-print">
                  <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => removeFromCart(item.id)}><Minus size={14}/></Button>
                  <span className="font-black text-amber-700">{item.quantity}</span>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className={`h-7 w-7 rounded-full ${item.quantity >= item.stock ? 'opacity-20 bg-red-50' : ''}`} 
                    onClick={() => addToCart(item)}
                  >
                    <Plus size={14}/>
                  </Button>
                </div>
                <p className="hidden print:block text-xs font-bold">{item.quantity} × {item.price} DH</p>
              </div>
              <div className="font-black text-amber-900">{(item.price * item.quantity).toFixed(2)} DH</div>
            </div>
          ))}
        </CardContent>

        <div className="p-6 bg-amber-50 border-t-2 border-amber-100 print:bg-white">
          <div className="flex justify-between text-3xl font-black text-amber-900 mb-6 italic print:text-2xl">
            <span>المجموع:</span><span>{subtotal.toFixed(2)} DH</span>
          </div>
          
          <div className="flex flex-col gap-3 no-print">
            <Button onClick={handlePrint} variant="outline" className="w-full h-14 border-2 border-amber-500 text-amber-600 rounded-2xl font-black text-lg flex items-center justify-center gap-2">
              <Printer size={22} /> طباعة الوصل (Ticket)
            </Button>
            <Button onClick={handleConfirmSale} className="w-full h-18 bg-emerald-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95">
              <CheckCircle2 size={26} /> تأكيد البيع النهائي
            </Button>
          </div>
          <p className="hidden print:block text-center text-[10px] font-black mt-4 italic">شكراً لزيارتكم - Eclat D'or</p>
        </div>
      </Card>
    </div>
  );
};

export default SalesInterface;