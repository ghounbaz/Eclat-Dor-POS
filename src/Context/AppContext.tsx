import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const fetchData = async () => {
    console.log("Fetching fresh data from Supabase...");
    const { data: prods, error: pError } = await supabase.from('products').select('*').order('name');
    if (prods) setProducts(prods);
    
    const { data: invs, error: iError } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (invs) setInvoices(invs);

    if (pError || iError) console.error("Error fetching:", pError || iError);
  };

  const migrateData = async () => {
    const savedProducts = localStorage.getItem("eclat_products");
    if (savedProducts) {
      const localData = JSON.parse(savedProducts);
      if (localData.length > 0) {
        const { error } = await supabase.from('products').upsert(
          localData.map((p: any) => ({
            name: p.name, price: p.price, stock: p.stock, category: p.category, barcode: p.barcode
          })),
          { onConflict: 'barcode' }
        );
        if (!error) {
          localStorage.removeItem("eclat_products");
          await fetchData();
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