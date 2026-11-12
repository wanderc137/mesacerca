import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await requireUser("/checkout");
  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        take: 5,
      },
    },
  });

  if (!user) redirect("/login?next=/checkout");

  return (
    <CheckoutClient
      user={{
        name: user.name,
        email: user.email,
        phone: user.phone,
      }}
      addresses={user.addresses.map((address) => ({
        id: address.id,
        label: address.label,
        line1: address.line1,
        comuna: address.comuna,
        instructions: address.instructions,
        isDefault: address.isDefault,
      }))}
      paymentsMode={process.env.PAYMENTS_MODE ?? "mock"}
    />
  );
}
