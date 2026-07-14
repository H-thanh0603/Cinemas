"use client";

import { AuthProvider } from "./auth-context";
import { CartProvider } from "./cart-context";
import { CompareProvider } from "./compare-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <CompareProvider>{children}</CompareProvider>
      </CartProvider>
    </AuthProvider>
  );
}
