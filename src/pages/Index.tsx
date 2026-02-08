import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, FileText, BarChart3, Calculator, Receipt } from "lucide-react";
import SalesInterface from "@/components/SalesInterface";
import ProductManagement from "@/components/ProductManagement";
import PurchaseInvoices from "@/components/PurchaseInvoices";
import ReportsSection from "@/components/ReportsSection";
import SalesInvoices from "@/components/SalesInvoices";

const Index = () => {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div className="min-h-screen bg-[#FFFCF8]" dir="rtl">
      {/* Header - ÉCLAT D'OR Branding */}
      <div className="bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* الأيقونة الذهبية */}
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200/50">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                {/* اسم البراند الجديد */}
                <h1 className="text-2xl font-black italic leading-none tracking-tight"
                    style={{
                      background: 'linear-gradient(to right, #bf953f, #b38728)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                  ÉCLAT D'OR
                </h1>
                <p className="text-[10px] font-bold text-amber-800/60 uppercase tracking-[0.2em] mt-1">
                  Votre Beauté, Notre Éclat
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold px-4 py-1">
                متصل
              </Badge>
              <Badge variant="outline" className="text-amber-600 border-amber-200 font-bold bg-amber-50">
                المتجر الرئيسي
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          {/* Navigation Tabs - الألوان الذهبية الجديدة */}
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm border border-amber-100 h-20 rounded-2xl shadow-sm overflow-hidden" dir="rtl">
            <TabsTrigger 
              value="reports"
              className="flex-col gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all duration-300 font-black"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] md:text-xs">التقارير</span>
            </TabsTrigger>
            <TabsTrigger 
              value="invoices"
              className="flex-col gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all duration-300 font-black"
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] md:text-xs">فواتير الشراء</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sales-invoices"
              className="flex-col gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all duration-300 font-black"
            >
              <Receipt className="w-5 h-5" />
              <span className="text-[10px] md:text-xs">فواتير المبيعات</span>
            </TabsTrigger>
            <TabsTrigger 
              value="products"
              className="flex-col gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all duration-300 font-black"
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] md:text-xs">المخزن</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sales" 
              className="flex-col gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all duration-300 font-black"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-[10px] md:text-xs font-black tracking-tight">نقطة البيع</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content مع Animation خفيف */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <TabsContent value="sales" className="m-0">
              <SalesInterface />
            </TabsContent>

            <TabsContent value="products" className="m-0">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="sales-invoices" className="m-0">
              <SalesInvoices />
            </TabsContent>

            <TabsContent value="invoices" className="m-0">
              <PurchaseInvoices />
            </TabsContent>

            <TabsContent value="reports" className="m-0">
              <ReportsSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer خفيف جداً */}
      <footer className="text-center py-8 opacity-20">
        <p className="text-[10px] font-black text-amber-900 tracking-[0.5em] uppercase">
          ÉCLAT D'OR &copy; 2026
        </p>
      </footer>
    </div>
  );
};

export default Index;