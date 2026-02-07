import { useApp } from "@/Context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, DollarSign, Calendar, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Reports = () => {
  const { invoices, products } = useApp();

  // 1. تصفية مبيعات اليوم، الأسبوع، والشهر
  const sales = invoices.filter((inv: any) => inv.type === 'sale');
  
  const today = new Date().toLocaleDateString();
  const todaySales = sales.filter((s: any) => new Date(s.date).toLocaleDateString() === today);
  const totalToday = todaySales.reduce((acc: number, s: any) => acc + s.total, 0);

  const totalMonth = sales.reduce((acc: number, s: any) => acc + s.total, 0); // المجموع العام حالياً
  
  // 2. إحصائيات المخزون
  const totalStockValue = products.reduce((acc: number, p: any) => acc + (p.stock * p.price), 0);
  const lowStockItems = products.filter((p: any) => p.stock < 5);

  return (
    <div className="p-6 space-y-8" dir="rtl">
      {/* العناوين العلوية */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-amber-900 italic flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-amber-600" /> لوحة التحكم والتقارير
          </h1>
          <p className="text-amber-600 font-bold mt-1 uppercase tracking-widest text-xs">Eclat D'or Business Intelligence</p>
        </div>
        <Badge variant="outline" className="border-amber-500 text-amber-700 px-4 py-1 rounded-full bg-amber-50">
          تحديث مباشر: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* كروت الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="مبيعات اليوم" value={`${totalToday.toFixed(2)} DH`} icon={<Calendar />} color="bg-blue-500" />
        <StatsCard title="مبيعات الشهر" value={`${totalMonth.toFixed(2)} DH`} icon={<TrendingUp />} color="bg-emerald-500" />
        <StatsCard title="قيمة المخزون" value={`${totalStockValue.toFixed(2)} DH`} icon={<DollarSign />} color="bg-amber-500" />
        <StatsCard title="منتجات نفذت" value={lowStockItems.length.toString()} icon={<Package />} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* قائمة المنتجات الأكثر مبيعاً أو الأكثر طلباً */}
        <Card className="rounded-[2rem] border-amber-100 shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-amber-50 border-b border-amber-100">
            <CardTitle className="text-amber-900 font-black flex items-center gap-2 italic">
              <ArrowUpRight className="text-emerald-500" /> حالة المخزون الحرجة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockItems.length > 0 ? (
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase">
                  <tr>
                    <th className="p-4">المنتج</th>
                    <th className="p-4 text-center">باقي في الستوك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStockItems.map((p: any) => (
                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-4 font-bold text-gray-700">{p.name}</td>
                      <td className="p-4 text-center">
                        <Badge variant="destructive" className="rounded-full">{p.stock} حبة</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-8 text-center text-gray-400 italic">كل السلع متوفرة بشكل جيد 👍</p>
            )}
          </CardContent>
        </Card>

        {/* ملخص العمليات الأخيرة */}
        <Card className="rounded-[2rem] border-amber-100 shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-amber-50 border-b border-amber-100">
            <CardTitle className="text-amber-900 font-black flex items-center gap-2 italic">
              <TrendingUp className="text-blue-500" /> آخر عمليات البيع
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {sales.slice(0, 5).map((sale: any) => (
              <div key={sale.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-black text-amber-900">عملية #{sale.id.slice(-5)}</p>
                  <p className="text-[10px] text-gray-400">{sale.date}</p>
                </div>
                <div className="text-left font-black text-emerald-600 text-lg">
                  {sale.total.toFixed(2)} DH
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// مكون صغير للكروت (Stats Card)
const StatsCard = ({ title, value, icon, color }: any) => (
  <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden group hover:scale-105 transition-transform">
    <CardContent className="p-6 flex items-center justify-between bg-white relative">
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${color}`} />
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">{title}</p>
        <p className="text-2xl font-black text-amber-900 italic">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
        {icon}
      </div>
    </CardContent>
  </Card>
);

export default Reports;