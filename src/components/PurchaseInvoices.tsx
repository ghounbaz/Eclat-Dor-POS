import { useState, useEffect } from "react";
import { useApp } from "@/Context/AppContext";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, User, ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

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
    try {
      const { data, error } = await supabase.from('purchases').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setSavedPurchases(data);
    } catch (err) {
      console.error("Error loading purchases:", err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const importedItems = json.map(row => ({
          productName: String(row["الاسم"] || row["Name"] || "").trim(),
          barcode: String(row["الباركود"] || row["Barcode"] || "").trim(),
          quantity: Number(row["الكمية"] || row["Qty"] || 0),
          purchasePrice: Number(row["ثمن الشراء"] || row["Cost"] || 0),
          salePrice: Number(row["ثمن البيع"] || row["Price"] || 0),
          category: row["الفئة"] || row["Category"] || "ماكياج",
          image: ""
        })).filter(item => item.productName !== "");

        if (importedItems.length === 0) throw new Error("الملف فارغ أو التنسيق غير صحيح");

        setInvoiceItems(importedItems);
        toast({ title: "تم الاستيراد بنجاح", description: `تم تحميل ${importedItems.length} منتج.` });
      } catch (err) {
        toast({ title: "خطأ في الملف", description: "تأكدي من أسماء الأعمدة في ملف Excel", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'barcode' && value !== "") {
      const existing = products.find((p: any) => p.barcode === value);
      if (existing) {
        newItems[index].productName = existing.name;
        newItems[index].salePrice = existing.price;
        newItems[index].category = existing.category;
        newItems[index].image = existing.image || "";
      }
    }
    setInvoiceItems(newItems);
  };

  const handleDeletePurchase = async (id: string) => {
    if (window.confirm("حذف هذه الفاتورة؟")) {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (!error) {
        toast({ title: "تم الحذف" });
        loadPurchases();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = invoiceItems.filter(item => item.productName !== "" && item.quantity > 0);
    
    if (validItems.length === 0) {
      toast({ title: "تنبيه", description: "لا توجد بيانات صالحة للحفظ", variant: "destructive" });
      return;
    }

    try {
      for (const item of validItems) {
        // تحديث المنتج في المخزن
        const { data: existingProd } = await supabase.from('products').select('*').eq('barcode', item.barcode).maybeSingle();
        
        if (existingProd) {
          await supabase.from('products').update({
            stock: Number(existingProd.stock || 0) + Number(item.quantity),
            price: item.salePrice,
            category: item.category,
            image: item.image || existingProd.image
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

        // تسجيل فاتورة الشراء
        await supabase.from('purchases').insert([{
          supplier: invoiceData.supplier,
          product_name: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          cost_price: item.purchasePrice,
          selling_price: item.salePrice,
          unit_price: item.purchasePrice,
          total_price: item.purchasePrice * item.quantity,
          invoice_number: invoiceData.invoiceNumber,
          date: invoiceData.date,
          category: item.category
        }]);
      }

      await fetchData(); 
      await loadPurchases();
      toast({ title: "تم الحفظ والتحديث بنجاح ✅" });
      setIsAddDialogOpen(false);
      setInvoiceItems([{ productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" }]);
    } catch (err: any) {
      toast({ title: "فشل في الحفظ", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 space-y-6" dir="rtl">
      <Card className="rounded-[2.5rem] border-amber-100 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-8">
          <CardTitle className="flex items-center gap-3 text-3xl font-black italic text-amber-900">
            <FileText className="h-10 w-10 text-amber-600" /> فواتير الشراء
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-[1.5rem] bg-amber-600 px-10 py-7 text-lg font-black text-white hover:bg-amber-700 shadow-xl transition-all">
                <Plus className="ml-2 h-6 w-6" /> إضافة فاتورة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-[2.5rem]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-amber-900 italic">إدخال سلع جديدة</DialogTitle>
              </DialogHeader>

              {/* منطقة رفع الملف */}
              <div className="mt-4 flex justify-between items-center p-6 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-900">استيراد من Excel</h4>
                  <p className="text-[10px] text-amber-600 font-bold">الأعمدة المطلوبة: الاسم، الباركود، الكمية، ثمن الشراء، ثمن البيع</p>
                </div>
                <Label htmlFor="excel-upload" className="cursor-pointer bg-white px-6 py-3 rounded-xl border border-amber-200 shadow-sm hover:bg-amber-100 transition-all flex items-center gap-2 font-black text-xs text-amber-700">
                  <Upload size={18} /> رفع ملف المورد
                  <input id="excel-upload" type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
                </Label>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 rounded-3xl border border-amber-100 bg-amber-50 p-6 md:grid-cols-3 font-bold">
                  <div className="space-y-1">
                    <Label className="text-xs mr-2">رقم الفاتورة</Label>
                    <Input value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})} className="rounded-xl border-amber-100" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs mr-2">المورد</Label>
                    <Input value={invoiceData.supplier} onChange={e => setInvoiceData({...invoiceData, supplier: e.target.value})} className="rounded-xl border-amber-100" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs mr-2">التاريخ</Label>
                    <Input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} className="rounded-xl border-amber-100" />
                  </div>
                </div>

                {invoiceItems.map((item, index) => (
                  <div key={index} className="space-y-4 rounded-[2rem] border border-amber-50 bg-white p-6 shadow-sm hover:border-amber-200 transition-colors">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-amber-500 mr-2 uppercase">الباركود</Label>
                        <Input value={item.barcode} onChange={e => updateItem(index, 'barcode', e.target.value)} className="h-12 bg-amber-50/20 font-bold rounded-xl" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[10px] font-black text-gray-400 mr-2">اسم المنتج</Label>
                        <Input value={item.productName} onChange={e => updateItem(index, 'productName', e.target.value)} className="h-12 font-black rounded-xl" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-blue-600">الكمية</Label>
                        <Input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} className="rounded-xl font-black" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">ثمن الشراء</Label>
                        <Input type="number" value={item.purchasePrice} onChange={e => updateItem(index, 'purchasePrice', parseFloat(e.target.value))} className="rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-emerald-600">ثمن البيع</Label>
                        <Input type="number" value={item.salePrice} onChange={e => updateItem(index, 'salePrice', parseFloat(e.target.value))} className="rounded-xl font-black" />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button type="submit" className="h-16 w-full rounded-[1.5rem] bg-emerald-600 text-xl font-black text-white shadow-xl hover:bg-emerald-700 transition-all">
                  تأكيد وحفظ الكل في المخزن ✅
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {savedPurchases.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-[2rem] border border-amber-100 bg-white p-6 shadow-sm group hover:border-amber-400 transition-all">
                <div className="space-y-1 text-right">
                  <p className="font-black italic text-amber-900 flex items-center gap-2">
                    <User size={14} className="text-amber-500" /> {inv.supplier || "بدون مورد"}
                  </p>
                  <p className="text-sm text-gray-600 font-bold">{inv.product_name} ({inv.quantity} قطعة)</p>
                  <p className="text-[10px] font-bold text-gray-400">#{inv.invoice_number} | {inv.date}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <p className="font-black text-emerald-600 text-lg">{inv.total_price} DH</p>
                   <Button variant="ghost" size="sm" className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDeletePurchase(inv.id)}>
                      <Trash2 size={16} />
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