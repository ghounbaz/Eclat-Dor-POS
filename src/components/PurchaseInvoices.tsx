import { useState, useEffect } from "react";
import { useApp } from "@/Context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Barcode, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PurchaseInvoices = () => {
  const { invoices, setInvoices, addInvoice, products } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "", supplier: "", date: new Date().toISOString().split('T')[0]
  });

  // قائمة الفئات الشاملة لـ Eclat D'or
  const allCategories = [
    "ماكياج",
    "عطور",
    "عناية بالبشرة",
    "عناية بالشعر",
    "إكسسوارات",
    "هدايا",
    "أظافر"
  ];

  const [invoiceItems, setInvoiceItems] = useState([{ 
    productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" 
  }]);

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // سكان ذكي: إذا سكانيتي كود موجود، كيعمر البيانات بوحدو
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = invoiceItems.filter(item => item.productName && item.quantity > 0);
    if (validItems.length === 0) return;

    const newInvoice = {
      id: "PUR-" + Date.now(),
      ...invoiceData,
      items: validItems,
      total: validItems.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0),
      type: 'purchase'
    };

    addInvoice(newInvoice, validItems.map(i => ({
      name: i.productName,
      barcode: i.barcode,
      qty: i.quantity,
      purchasePrice: i.purchasePrice,
      salePrice: i.salePrice,
      category: i.category,
      image: i.image
    })));

    toast({ title: "تم الحفظ بنجاح" });
    setIsAddDialogOpen(false);
    setInvoiceItems([{ productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" }]);
  };

  return (
    <div className="p-4 space-y-6" dir="rtl">
      <Card className="rounded-[2.5rem] border-amber-100 shadow-sm bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between p-8">
          <CardTitle className="text-amber-900 font-black italic flex items-center gap-3 text-3xl">
            <FileText className="text-amber-600 w-10 h-10" /> السلع والمشتريات
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-black px-10 py-7 rounded-[1.5rem] shadow-xl text-lg transition-all hover:scale-105">
                <Barcode className="ml-2 w-6 h-6" /> سكان سلع جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-amber-900 italic">إدخال سلع Eclat D'or</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <Input placeholder="رقم الفاتورة" value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})} className="rounded-xl border-amber-200" />
                  <Input placeholder="المورد" value={invoiceData.supplier} onChange={e => setInvoiceData({...invoiceData, supplier: e.target.value})} className="rounded-xl border-amber-200" />
                  <Input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} className="rounded-xl border-amber-200" />
                </div>

                {invoiceItems.map((item, index) => (
                  <div key={index} className="p-6 border-2 border-amber-50 rounded-[2rem] bg-white space-y-4 shadow-sm relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-amber-500 flex items-center gap-1 uppercase tracking-tighter"><Barcode size={14}/> باركود (سكاني هنا)</Label>
                        <Input 
                          autoFocus={index === invoiceItems.length - 1}
                          placeholder="سكاني الكود..." 
                          value={item.barcode} 
                          onChange={e => updateItem(index, 'barcode', e.target.value)} 
                          className="font-mono font-bold h-12 bg-amber-50/30"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[10px] font-black text-gray-400 uppercase">اسم المنتج</Label>
                        <Input placeholder="أدخلي اسم المنتج..." value={item.productName} onChange={e => updateItem(index, 'productName', e.target.value)} className="h-12 font-bold" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input type="number" placeholder="الكمية" onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} />
                      <Input type="number" placeholder="ثمن الشراء" onChange={e => updateItem(index, 'purchasePrice', parseFloat(e.target.value))} />
                      <Input type="number" placeholder="ثمن البيع" value={item.salePrice} onChange={e => updateItem(index, 'salePrice', parseFloat(e.target.value))} className="font-black text-emerald-600 border-emerald-100" />
                      <Select value={item.category} onValueChange={v => updateItem(index, 'category', v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {allCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="رابط الصورة (URL)" value={item.image} onChange={e => updateItem(index, 'image', e.target.value)} className="text-xs" />
                  </div>
                ))}
                
                <Button type="button" variant="outline" className="w-full border-dashed border-amber-300 text-amber-600 rounded-xl h-12" onClick={() => setInvoiceItems([...invoiceItems, { productName: "", barcode: "", quantity: 0, purchasePrice: 0, salePrice: 0, category: "ماكياج", image: "" }])}>
                  + إضافة سطر لمنتج آخر
                </Button>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[1.5rem] font-black text-xl shadow-xl mt-4 transition-transform active:scale-95">
                  تأكيد وحفظ الكل
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* قائمة الفواتير المسجلة */}
        <CardContent className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {invoices.filter((i:any)=>i.type==='purchase').map((inv:any) => (
               <div key={inv.id} className="p-5 bg-white border border-amber-100 rounded-[2rem] flex justify-between items-center shadow-sm hover:shadow-md transition-shadow italic">
                 <div>
                   <p className="font-black text-amber-900">المورد: {inv.supplier}</p>
                   <p className="text-xs text-amber-500">#{inv.invoiceNumber} | {inv.date}</p>
                 </div>
                 <div className="text-left">
                   <p className="font-black text-emerald-600">{inv.total.toFixed(2)} DH</p>
                   <Button variant="ghost" size="sm" className="text-red-400 p-0 h-6" onClick={() => setInvoices(invoices.filter((v:any)=>v.id !== inv.id))}>حذف</Button>
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