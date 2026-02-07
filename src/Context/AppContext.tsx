import React, { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. كنجيبو البيانات القديمة من localStorage إلا كانت موجودة
  const [products, setProducts] = useState<any[]>(() => {
    const saved = localStorage.getItem("eclat_products");
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<any[]>(() => {
    const saved = localStorage.getItem("eclat_invoices");
    return saved ? JSON.parse(saved) : [];
  });

  // 2. كل ما تبدلوا المنتجات، كنحفظوهم أوتوماتيكياً
  useEffect(() => {
    localStorage.setItem("eclat_products", JSON.stringify(products));
  }, [products]);

  // 3. كل ما تبدلات الفواتير، كنحفظوهم أوتوماتيكياً
  useEffect(() => {
    localStorage.setItem("eclat_invoices", JSON.stringify(invoices));
  }, [invoices]);

  const addInvoice = (invoice: any, newItems: any[]) => {
    setInvoices((prev) => [invoice, ...prev]);
    setProducts((currentProducts) => {
      const updatedProducts = [...currentProducts];
      newItems.forEach((newP) => {
        const index = updatedProducts.findIndex((p) => p.barcode === newP.barcode);
        if (index !== -1) {
          updatedProducts[index].stock += newP.qty;
          updatedProducts[index].price = newP.salePrice;
          if (newP.image) updatedProducts[index].image = newP.image;
        } else {
          updatedProducts.push({
            id: "PRD-" + Date.now() + Math.random(),
            name: newP.name,
            barcode: newP.barcode,
            stock: newP.qty,
            price: newP.salePrice,
            category: newP.category,
            image: newP.image,
          });
        }
      });
      return updatedProducts;
    });
  };

  return (
    <AppContext.Provider value={{ products, setProducts, invoices, setInvoices, addInvoice }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);