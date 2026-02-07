import { useApp } from "@/Context/AppContext"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, FileText, Calendar, Trash2, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const SalesInvoices = () => {
  const { invoices, setInvoices } = useApp(); 
  
  // تصفية دقيقة: أي فاتورة ما فيهاش مورد (Supplier) هي مبيعات
  const salesOnly = invoices.filter((inv: any) => !inv.supplier);

  const deleteInvoice = (id: string) => {
    if (window.confirm("هل تريد حذف هذه الفاتورة نهائياً؟")) {
      setInvoices(invoices.filter((i: any) => i.id !== id));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card className="bg-white border-amber-100 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-amber-50/50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-amber-900 font-black flex items-center gap-2 italic">
                <FileText className="text-amber-600" /> سجل فواتير المبيعات - Eclat D'or
              </CardTitle>
              <p className="text-sm text-amber-600 font-bold mt-1">
                إجمالي العمليات: {salesOnly.length} فاتورة
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-2xl">
              <Receipt className="text-amber-700 w-6 h-6" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* List of Invoices */}
      <div className="grid gap-4">
        {salesOnly.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-amber-50">
            <Receipt className="mx-auto h-16 w-16 text-amber-100 mb-4" />
            <p className="font-black text-gray-400 text-xl italic">لا توجد مبيعات مسجلة حتى الآن</p>
          </div>
        ) : (
          salesOnly.map((inv: any) => (
            <Card key={inv.id} className="border-amber-50 hover:border-amber-200 transition-all shadow-sm rounded-2xl group overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-600 text-white p-3 rounded-xl shadow-md">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-amber-200 text-amber-700 font-bold">
                          {inv.invoiceNumber}
                        </Badge>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3"/> {inv.date}
                        </span>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3"/> {inv.time}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-600">
                        عدد المنتجات: {inv.items?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-left">
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">المبلغ الإجمالي</p>
                      <p className="font-black text-2xl text-amber-900">{inv.total?.toFixed(2)} <small className="text-xs">DH</small></p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-200 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl"
                      onClick={() => deleteInvoice(inv.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                {/* عرض المنتجات داخل الفاتورة بشكل مصغر */}
                <div className="bg-amber-50/30 px-5 py-2 border-t border-amber-50 flex gap-2 overflow-x-auto">
                   {inv.items?.map((item: any, idx: number) => (
                     <span key={idx} className="text-[10px] bg-white px-2 py-1 rounded-full border border-amber-100 text-amber-800 font-bold whitespace-nowrap">
                       {item.name} (x{item.quantity})
                     </span>
                   ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesInvoices;