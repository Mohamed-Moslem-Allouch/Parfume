import { HeaderClient } from "@/components/header-client";
import { getPublicMenuItems } from "@/lib/menu";

import { prisma } from "@/lib/prisma";

export async function Header() {
  const [menuItems, visualCategoryRows] = await Promise.all([
    getPublicMenuItems(),
    // Load all visual categories + published pages, then build hierarchy in memory
    (prisma as any).visualCategory 
      ? prisma.visualCategory.findMany({
          include: {
            pages: {
              where: { published: true },
              select: { id: true, title: true, slug: true, collectionImage: true }
            }
          },
          orderBy: { name: "asc" }
        }).catch(() => {
          return [];
        })
      : Promise.resolve([])
  ]);

  const rowsById = new Map(visualCategoryRows.map((row: any) => [row.id, row]));
  const childIdsByParent = new Map<string, string[]>();
  for (const row of visualCategoryRows as any[]) {
    if (!row.parentId) continue;
    const existing = childIdsByParent.get(row.parentId) || [];
    existing.push(row.id);
    childIdsByParent.set(row.parentId, existing);
  }

  const buildNode = (id: string, visited: Set<string>): any => {
    // Guard against accidental cyclic parent links (A -> B -> A).
    if (visited.has(id)) return null;
    const row = rowsById.get(id);
    if (!row) return null;
    const nextVisited = new Set(visited);
    nextVisited.add(id);
    const childIds = (childIdsByParent.get(id) || []).sort((a, b) => {
      const aName = String(rowsById.get(a)?.name || "");
      const bName = String(rowsById.get(b)?.name || "");
      return aName.localeCompare(bName);
    });
    return {
      ...row,
      children: childIds.map((childId) => buildNode(childId, nextVisited)).filter(Boolean)
    };
  };

  // Send only top-level roots to the menu; each root includes its full nested tree.
  const rootRows = (visualCategoryRows as any[]).filter((row) => !row.parentId);
  const visualCategories = rootRows.map((row) => buildNode(row.id, new Set())).filter(Boolean);

  return <HeaderClient menuItems={menuItems} visualCategories={visualCategories} />;
}
