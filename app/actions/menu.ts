"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { safeHttpUrl } from "@/lib/urls";

async function currentMerchant() {
  const session = await getSession();
  if (!session || session.role !== "MERCHANT") {
    redirect("/login?next=/merchant/menu");
  }
  if (process.env.MFA_ENFORCED === "true" && !session.mfaEnabled) {
    redirect("/settings/security");
  }
  const merchant = await db.merchant.findUnique({
    where: { ownerId: session.id },
  });
  if (!merchant) redirect("/registro/local");
  return merchant;
}

async function assertStore(storeId: string, merchantId: string) {
  const store = await db.store.findFirst({
    where: { id: storeId, merchantId },
  });
  if (!store) throw new Error("Local no encontrado");
  return store;
}

async function assertCategory(categoryId: string, merchantId: string) {
  const category = await db.category.findFirst({
    where: { id: categoryId, store: { merchantId } },
    include: { store: true },
  });
  if (!category) throw new Error("Categoría no encontrada");
  return category;
}

async function assertItem(itemId: string, merchantId: string) {
  const item = await db.menuItem.findFirst({
    where: { id: itemId, category: { store: { merchantId } } },
    include: { category: { include: { store: true } } },
  });
  if (!item) throw new Error("Plato no encontrado");
  return item;
}

export async function createCategoryAction(formData: FormData) {
  const merchant = await currentMerchant();
  const storeId = String(formData.get("storeId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!storeId || name.length < 2 || name.length > 60) return;
  await assertStore(storeId, merchant.id);
  const count = await db.category.count({ where: { storeId } });
  await db.category.create({
    data: { storeId, name, position: count },
  });
  revalidatePath("/merchant/menu");
}

export async function createMenuItemAction(formData: FormData) {
  const merchant = await currentMerchant();
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const emoji = String(formData.get("emoji") ?? "").trim();
  const imageUrl = safeHttpUrl(String(formData.get("imageUrl") ?? ""));

  if (
    !categoryId ||
    name.length < 2 ||
    name.length > 80 ||
    description.length > 300 ||
    emoji.length > 8 ||
    !Number.isFinite(price) ||
    price < 100 ||
    price > 1_000_000
  ) {
    return;
  }
  const category = await assertCategory(categoryId, merchant.id);
  const count = await db.menuItem.count({ where: { categoryId } });
  await db.menuItem.create({
    data: {
      categoryId,
      name,
      description: description || null,
      price: Math.round(price),
      emoji: emoji || category.store.emoji,
      imageUrl: imageUrl || null,
      position: count,
      available: true,
    },
  });
  revalidatePath("/merchant/menu");
}

export async function updateMenuItemAction(formData: FormData) {
  const merchant = await currentMerchant();
  const itemId = String(formData.get("itemId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const emoji = String(formData.get("emoji") ?? "").trim();
  if (
    !itemId ||
    name.length < 2 ||
    name.length > 80 ||
    description.length > 300 ||
    emoji.length > 8 ||
    !Number.isFinite(price) ||
    price < 100 ||
    price > 1_000_000
  ) {
    return;
  }
  await assertItem(itemId, merchant.id);
  await db.menuItem.update({
    where: { id: itemId },
    data: {
      name,
      description: description || null,
      price: Math.round(price),
      emoji: emoji || null,
    },
  });
  revalidatePath("/merchant/menu");
}

export async function toggleMenuItemAction(formData: FormData) {
  const merchant = await currentMerchant();
  const itemId = String(formData.get("itemId") ?? "");
  const available = String(formData.get("available") ?? "") === "true";
  if (!itemId) return;
  await assertItem(itemId, merchant.id);
  await db.menuItem.update({
    where: { id: itemId },
    data: { available },
  });
  revalidatePath("/merchant/menu");
}

export async function deleteMenuItemAction(formData: FormData) {
  const merchant = await currentMerchant();
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;
  await assertItem(itemId, merchant.id);
  await db.menuItem.delete({ where: { id: itemId } });
  revalidatePath("/merchant/menu");
}
