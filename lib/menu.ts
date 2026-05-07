import { unstable_noStore as noStore } from "next/cache";
import type { MenuItem, Page } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MenuItemWithPage = MenuItem & {
  page: Pick<Page, "slug" | "published"> | null;
};

export type PublicMenuItem = {
  id: string;
  label: string;
  href: string;
  type: string;
};

export const defaultMenuItems: PublicMenuItem[] = [
  { id: "home", label: "Home", href: "/", type: "INTERNAL" },
  { id: "shop", label: "Shop", href: "/shop", type: "INTERNAL" },
  { id: "cart", label: "Cart", href: "/cart", type: "INTERNAL" }
];

export function resolveMenuHref(item: MenuItemWithPage) {
  if (item.type === "PAGE") {
    return item.page?.published && item.page.slug ? `/${item.page.slug}` : "";
  }

  return item.href || "";
}

export function serializeMenuItem(item: MenuItemWithPage): PublicMenuItem | null {
  const href = resolveMenuHref(item);

  if (!href) {
    return null;
  }

  return {
    id: item.id,
    label: item.label,
    href,
    type: item.type
  };
}

export async function getPublicMenuItems() {
  noStore();
  const items = await prisma.menuItem.findMany({
    where: { visible: true },
    include: {
      page: {
        select: { slug: true, published: true }
      }
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });

  const menu = items.map(serializeMenuItem).filter((item): item is PublicMenuItem => Boolean(item));

  return menu.length ? menu : defaultMenuItems;
}

export async function getNextMenuPosition() {
  const last = await prisma.menuItem.findFirst({
    orderBy: { position: "desc" },
    select: { position: true }
  });

  return (last?.position ?? -1) + 1;
}
