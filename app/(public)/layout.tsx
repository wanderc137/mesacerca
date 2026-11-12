import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
