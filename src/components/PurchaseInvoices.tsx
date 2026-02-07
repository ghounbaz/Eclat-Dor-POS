import { useState, useEffect } from "react";
import { useApp } from "@/Context/AppContext";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Barcode, Calendar, User } from "lucide-react";
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
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSavedPurchases(data);
    if (error) console.error("Error loading purchases:", error);
  };

  const handleDeletePurchase = async (id: string) => {
    if (window.confirm("واش متأكدة بغيتي تمسحي هاد الفاتورة من السجل؟")) {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (!error) {
        toast({ title: "تم الحذف بنجاح" });
        loadPurchases();
      }
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // ميزة البحث التلقائي: إذا كان الباركود مسجل مسبقاً، يعمر البيانات
    if (field === 'barcode' && value !== "") {
      const existingProduct = products.find((p: any) => p.barcode === value);
      if (existingProduct) {
        newItems[index].productName = existingProduct.name;
        newItems[index].salePrice = existingProduct.price;
        newItems[index].category = existingProduct.category;
        newItems[index].image = existingProduct.image || "";
      }
    }
    setInvoiceItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = invoiceItems.filter(item => item.productName && item.quantity > 0);
    if (validItems.length === 0) return;

    // 1. حفظ المشتريات (لأغراض سجل الفواتير والتقارير المالية)
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
      toast({ title: "خطأ في الحفظ", description: "تأكدي من إضافة عمود barcode في Supabase", variant: "destructive" });
      return;
    }

    // 2. تحديث جدول المنتجات (الأساس اللي كايقرا منو POS والتقارير والمنتجات)
    for (const item of validItems) {
      const { data: existing } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', item.barcode)
        .single();
      
      if (existing) {
        // تحديث المنتج: زيادة الكمية وتحديث الثمن
        await supabase.from('products').update({ 
          stock: Number(existing.stock || 0) + Number(item.quantity),
          price: item.salePrice,
          category: item.category,
          image: item.image || existing.image
        }).eq('barcode', item.barcode);
      } else {
        // إضافة منتج جديد تماماً
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

    // 3. تحديث البيانات في التطبيق فوراً بلا Refresh
    await fetchData(); 
    await loadPurchases();
    
    toast({ title: "تم التحديث بنجاح ✅ السلعة دابا في POS والتقارير" });
    setIsAddDialogOpen(false);
    setInvoiceItems([{ productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" }]);
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
              <DialogHeader>
                 <DialogTitle className="text-2xl font-black text-amber-900">إدخال سلع جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <div className="space-y-2">
                    <Label>رقم الفاتورة</Label>
                    <Input placeholder="رقم الفاتورة" value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>المورد</Label>
                    <Input placeholder="المورد" value={invoiceData.supplier} onChange={e => setInvoiceData({...invoiceData, supplier: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} />
                  </div>
                </div>

                {invoiceItems.map((item, index) => (
                  <div key={index} className="p-6 border-2 border-amber-50 rounded-[2rem] bg-white space-y-4 shadow-sm relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-amber-500">الباركود</Label>
                        <Input placeholder="سكاني هنا..." value={item.barcode} onChange={e => updateItem(index, 'barcode', e.target.value)} className="h-12 bg-amber-50/30 font-bold" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[10px] font-black text-gray-400">اسم المنتج</Label>
                        <Input placeholder="اسم المنتج..." value={item.productName} onChange={e => updateItem(index, 'productName', e.target.value)} className="h-12 font-bold" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">الكمية</Label>
                        <Input type="number" placeholder="الكمية" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} className="font-bold text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">ثمن الشراء</Label>
                        <Input type="number" placeholder="ثمن الشراء" value={item.purchasePrice} onChange={e => updateItem(index, 'purchasePrice', parseFloat(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">ثمن البيع</Label>
                        <Input type="number" placeholder="ثمن البيع" value={item.salePrice} onChange={e => updateItem(index, 'salePrice', parseFloat(e.target.value))} className="font-bold text-emerald-600 border-emerald-100" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">الفئة</Label>
                        <Select value={item.category} onValueChange={v => updateItem(index, 'category', v)}>
                          <SelectTrigger className="rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>{allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Input placeholder="رابط الصورة (URL)" value={item.image} onChange={e => updateItem(index, 'image', e.target.value)} className="text-xs italic text-gray-400" />
                  </div>
                ))}
                
                <Button type="button" variant="outline" className="w-full border-dashed border-amber-300 text-amber-600 rounded-xl h-12" onClick={() => setInvoiceItems([...invoiceItems, { productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" }])}>
                  + إضافة سطر لمنتج آخر
                </Button>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[1.5rem] font-black text-xl shadow-xl transition-all active:scale-95">
                  تأكيد وحفظ الكل ✅
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPurchases.map((inv: any) => (
              <div key={inv.id} className="p-5 bg-white border border-amber-100 rounded-[2rem] flex justify-between items-center shadow-sm relative group hover:border-amber-300 transition-colors">
                <div className="space-y-1">
                  <p className="font-black text-amber-900 italic flex items-center gap-2"><User size={14} className="text-amber-500"/> المورد: {inv.supplier}</p>
                  <p className="text-[10px] text-amber-600 font-bold italic flex items-center gap-2"><Calendar size={14}/> {inv.date} | #{inv.invoice_number}</p>
                  <p className="text-sm font-medium text-gray-600">{inv.product_name} ({inv.quantity} حبة)</p>
                </div>
                <div className="text-left flex flex-col items-end gap-2">
                  <p className="font-black text-emerald-600 text-lg">{(inv.cost_price * inv.quantity).toFixed(2)} DH</p>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 p-0 h-8 w-8 hover:bg-red-50 rounded-full transition-all" onClick={() => handleDeletePurchase(inv.id)}>
                    <Trash2 size={18} />
                  </Button>
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