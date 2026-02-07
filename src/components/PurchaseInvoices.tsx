import { useState, useEffect } from "react";
import { useApp } from "@/Context/AppContext";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Barcode, Calendar, User, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PurchaseInvoices = () => {
  const { products, fetchData } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [savedPurchases, setSavedPurchases] = useState<any[]>([]); // لعرض الفواتير المسجلة
  const { toast } = useToast();

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "", supplier: "", date: new Date().toISOString().split('T')[0]
  });

  const allCategories = ["ماكياج", "عطور", "عناية بالبشرة", "عناية بالشعر", "إكسسوارات", "هدايا", "أظافر"];

  const [invoiceItems, setInvoiceItems] = useState([{ 
    productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" 
  }]);

  // جلب الفواتير من Supabase عند تحميل الصفحة
  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSavedPurchases(data);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'barcode' && value !== "") {
      const existingProduct = products.find((p: any) => p.barcode === value);
      if (existingProduct) {
        newItems[index].productName = existingProduct.name;
        newItems[index].salePrice = existingProduct.price;
        newItems[index].category = existingProduct.category;
        newItems[index].image = existingProduct.image || "";
        toast({ title: "تم التعرف على: " + existingProduct.name });
      }
    }
    setInvoiceItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = invoiceItems.filter(item => item.productName && item.quantity > 0);
    if (validItems.length === 0) return;

    // 1. حفظ في جدول المشتريات
    const { error: purchaseError } = await supabase.from('purchases').insert(
      validItems.map(item => ({
        invoice_number: invoiceData.invoiceNumber,
        supplier: invoiceData.supplier,
        date: invoiceData.date,
        product_name: item.productName,
        barcode: item.barcode,
        quantity: item.quantity,
        cost_price: item.purchasePrice,
        selling_price: item.salePrice,
        category: item.category
      }))
    );

    if (purchaseError) {
      toast({ title: "خطأ في الحفظ", description: purchaseError.message, variant: "destructive" });
      return;
    }

    // 2. تحديث المخزون (الـ Stock)
    for (const item of validItems) {
      const { data: existing } = await supabase.from('products').select('stock').eq('barcode', item.barcode).single();
      
      if (existing) {
        await supabase.from('products').update({ 
          stock: Number(existing.stock) + Number(item.quantity),
          price: item.salePrice,
          image: item.image 
        }).eq('barcode', item.barcode);
      } else {
        await supabase.from('products').insert([{
          name: item.productName, barcode: item.barcode, price: item.salePrice,
          stock: item.quantity, category: item.category, image: item.image
        }]);
      }
    }

    toast({ title: "تم الحفظ وتحديث المخزون بنجاح ✅" });
    setIsAddDialogOpen(false);
    setInvoiceItems([{ productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" }]);
    fetchData(); 
    loadPurchases(); // تحديث قائمة الفواتير المعروضة
  };

  return (
    <div className="p-4 space-y-6" dir="rtl">
      <Card className="rounded-[2.5rem] border-amber-100 shadow-sm bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between p-8">
          <CardTitle className="text-amber-900 font-black italic flex items-center gap-3 text-3xl">
            <FileText className="text-amber-600 w-10 h-10" /> سجل المشتريات Eclat D'or
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-black px-10 py-7 rounded-[1.5rem] shadow-xl text-lg transition-all hover:scale-105">
                <Plus className="ml-2 w-6 h-6" /> إضافة فاتورة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem]" dir="rtl">
              <DialogHeader><DialogTitle className="text-2xl font-black text-amber-900 italic">إدخال سلع جديدة</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <Input placeholder="رقم الفاتورة" value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})} className="rounded-xl" />
                  <Input placeholder="المورد" value={invoiceData.supplier} onChange={e => setInvoiceData({...invoiceData, supplier: e.target.value})} className="rounded-xl" />
                  <Input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} className="rounded-xl" />
                </div>

                {invoiceItems.map((item, index) => (
                  <div key={index} className="p-6 border-2 border-amber-50 rounded-[2rem] bg-white space-y-4 shadow-sm relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-amber-500 uppercase">الباركود</Label>
                        <Input placeholder="سكاني هنا..." value={item.barcode} onChange={e => updateItem(index, 'barcode', e.target.value)} className="font-mono h-12 bg-amber-50/30" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[10px] font-black text-gray-400 uppercase">اسم المنتج</Label>
                        <Input placeholder="اسم المنتج..." value={item.productName} onChange={e => updateItem(index, 'productName', e.target.value)} className="h-12" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input type="number" placeholder="الكمية" onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} className="rounded-xl" />
                      <Input type="number" placeholder="ثمن الشراء" onChange={e => updateItem(index, 'purchasePrice', parseFloat(e.target.value))} className="rounded-xl" />
                      <Input type="number" placeholder="ثمن البيع" value={item.salePrice} onChange={e => updateItem(index, 'salePrice', parseFloat(e.target.value))} className="rounded-xl font-bold text-emerald-600 border-emerald-100" />
                      <Select value={item.category} onValueChange={v => updateItem(index, 'category', v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="رابط الصورة (URL)" value={item.image} onChange={e => updateItem(index, 'image', e.target.value)} className="text-xs italic text-gray-400" />
                  </div>
                ))}
                
                <Button type="button" variant="outline" className="w-full border-dashed border-amber-300 text-amber-600 rounded-xl" onClick={() => setInvoiceItems([...invoiceItems, { productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" }])}>
                  + إضافة سطر لمنتج آخر
                </Button>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[1.5rem] font-black text-xl shadow-xl transition-transform active:scale-95">
                  تأكيد وحفظ الكل ✅
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* قائمة المشتريات المسجلة من Supabase */}
        <CardContent className="p-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" /> آخر المشتريات المسجلة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPurchases.length === 0 ? (
                <p className="text-gray-400 italic">لا توجد فواتير مسجلة حالياً.</p>
              ) : (
                savedPurchases.map((inv: any) => (
                  <div key={inv.id} className="p-5 bg-amber-50/30 border border-amber-100 rounded-[2rem] flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                      <p className="font-black text-amber-900 flex items-center gap-2">
                        <User size={14} className="text-amber-500" /> المورد: {inv.supplier}
                      </p>
                      <p className="text-xs text-amber-600 font-bold flex items-center gap-2 italic">
                        <Calendar size={14} /> {inv.date} | #{inv.invoice_number}
                      </p>
                      <p className="text-sm font-medium text-gray-600 truncate max-w-[200px]">{inv.product_name}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-emerald-600 text-lg">{(inv.cost_price * inv.quantity).toFixed(2)} DH</p>
                      <p className="text-[10px] font-bold text-gray-400">الكمية: {inv.quantity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseInvoices;