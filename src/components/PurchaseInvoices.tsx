import { useState, useEffect } from "react";
import { useApp } from "@/Context/AppContext";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PurchaseInvoices = () => {
  const { products, fetchData } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [savedPurchases, setSavedPurchases] = useState<any[]>([]); 
  const { toast } = useToast();

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "", supplier: "", date: new Date().toISOString().split('T')[0]
  });

  const allCategories = ["ماكياج", "عطور", "عناية بالبشرة", "عناية بالشعر", "إكسسوارات", "هدايا", "أظافر"];

  const [invoiceItems, setInvoiceItems] = useState([{ 
    productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" 
  }]);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    const { data } = await supabase.from('purchases').select('*').order('created_at', { ascending: false });
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
      }
    }
    setInvoiceItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = invoiceItems.filter(item => item.productName && item.quantity > 0);
    if (validItems.length === 0) return;

    try {
      for (const item of validItems) {
        // 1. الحفظ في جدول المشتريات (Purchases)
        await supabase.from('purchases').insert([{
          supplier: invoiceData.supplier,
          quantity: item.quantity,
          product_id: null // يمكن ربطه لاحقاً بـ ID المنتج
        }]);

        // 2. التحديث في جدول المنتجات (Products) لضمان الظهور في POS
        const { data: existing } = await supabase
          .from('products')
          .select('*')
          .eq('barcode', item.barcode)
          .single();
        
        if (existing) {
          await supabase.from('products').update({ 
            stock: Number(existing.stock || 0) + Number(item.quantity),
            price: item.salePrice
          }).eq('barcode', item.barcode);
        } else {
          await supabase.from('products').insert([{
            name: item.productName,
            barcode: item.barcode,
            price: item.salePrice,
            stock: item.quantity,
            category: item.category,
            image: item.image
          }]);
        }
      }

      await fetchData(); // تحديث بيانات التطبيق ونقطة البيع
      await loadPurchases();
      toast({ title: "تم الحفظ بنجاح ✅ السلعة الآن في نقطة البيع" });
      setIsAddDialogOpen(false);
      setInvoiceItems([{ productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" }]);

    } catch (error) {
      toast({ title: "خطأ في المزامنة", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 space-y-6" dir="rtl">
      <Card className="rounded-[2.5rem] border-amber-100 shadow-sm bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between p-8">
          <CardTitle className="text-amber-900 font-black italic flex items-center gap-3 text-3xl">
            <FileText className="text-amber-600 w-10 h-10" /> المشتريات والسلع
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-black px-10 py-7 rounded-[1.5rem] shadow-xl text-lg transition-all hover:scale-105">
                <Plus className="ml-2 w-6 h-6" /> إضافة فاتورة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem]" dir="rtl">
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <Input placeholder="رقم الفاتورة" value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})} />
                  <Input placeholder="المورد" value={invoiceData.supplier} onChange={e => setInvoiceData({...invoiceData, supplier: e.target.value})} />
                  <Input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} />
                </div>

                {invoiceItems.map((item, index) => (
                  <div key={index} className="p-6 border-2 border-amber-50 rounded-[2rem] bg-white space-y-4 shadow-sm relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-amber-500">الباركود</Label>
                        <Input placeholder="الباركود" value={item.barcode} onChange={e => updateItem(index, 'barcode', e.target.value)} className="h-12 bg-amber-50/30 font-bold" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[10px] font-black text-gray-400">اسم المنتج</Label>
                        <Input placeholder="اسم المنتج" value={item.productName} onChange={e => updateItem(index, 'productName', e.target.value)} className="h-12 font-bold" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input type="number" placeholder="الكمية" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} className="font-bold text-blue-600" />
                      <Input type="number" placeholder="ثمن الشراء" value={item.purchasePrice} onChange={e => updateItem(index, 'purchasePrice', parseFloat(e.target.value))} />
                      <Input type="number" placeholder="ثمن البيع" value={item.salePrice} onChange={e => updateItem(index, 'salePrice', parseFloat(e.target.value))} className="font-bold text-emerald-600" />
                      <Select value={item.category} onValueChange={v => updateItem(index, 'category', v)}>
                        <SelectTrigger className="rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[1.5rem] font-black text-xl">تأكيد وحفظ الكل ✅</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPurchases.map((inv: any) => (
              <div key={inv.id} className="p-5 bg-white border border-amber-100 rounded-[2rem] flex justify-between items-center shadow-sm">
                <div className="space-y-1">
                  <p className="font-black text-amber-900 italic flex items-center gap-2"><User size={14}/> المورد: {inv.supplier}</p>
                  <p className="text-sm text-gray-600">الكمية: {inv.quantity} حبة</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseInvoices;