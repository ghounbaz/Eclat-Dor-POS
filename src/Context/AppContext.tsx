import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // وظيفة لجلب البيانات من Supabase
  const fetchData = async () => {
    const { data: prods } = await supabase.from('products').select('*');
    if (prods) setProducts(prods);
    
    const { data: invs } = await supabase.from('invoices').select('*');
    if (invs) setInvoices(invs);
  };

  // وظيفة سحرية لنقل البيانات من LocalStorage لـ Supabase (مرة واحدة فقط)
  const migrateData = async () => {
    const savedProducts = localStorage.getItem("eclat_products");
    if (savedProducts) {
      const localData = JSON.parse(savedProducts);
      if (localData.length > 0) {
        // كنصيفطو السلعة لـ Supabase
        const { error } = await supabase.from('products').upsert(
          localData.map((p: any) => ({
            name: p.name,
            price: p.price,
            stock: p.stock,
            category: p.category,
            barcode: p.barcode
          })),
          { onConflict: 'barcode' } // باش ما يتعاودش نفس الباركود
        );
        
        if (!error) {
          console.log("Migration successful!");
          localStorage.removeItem("eclat_products"); // كنمسحوها من المتصفح حيت صافي ولات في Cloud
          fetchData();
        }
      }
    }
  };

  useEffect(() => {
    migrateData();
    fetchData();
  }, []);

  return (
    <AppContext.Provider value={{ products, setProducts, invoices, setInvoices, fetchData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);