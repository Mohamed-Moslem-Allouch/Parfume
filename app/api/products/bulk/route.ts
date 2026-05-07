import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRODUCT_STATUSES } from "@/lib/status";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      productIds,
      categoryId,
      visualCategoryId,
      status,
      action,
      pageId,
      pageAction = "connect"
    } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ message: "No products selected" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.product.deleteMany({
        where: { id: { in: productIds } }
      });
      return NextResponse.json({ message: "Products deleted successfully" });
    }

    const data: any = {};
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (visualCategoryId !== undefined) data.visualCategoryId = visualCategoryId || null;
    if (status !== undefined) {
      if (!PRODUCT_STATUSES.includes(status)) {
        return NextResponse.json({ message: "Invalid product status" }, { status: 400 });
      }
      data.status = status;
    }

    const updates = [];

    if (Object.keys(data).length > 0) {
      updates.push(prisma.product.updateMany({
        where: { id: { in: productIds } },
        data
      }));
    }

    // Handle Page relationships (Many-to-Many)
    if (pageId) {
      productIds.forEach(id => {
        updates.push(prisma.product.update({
          where: { id },
          data: {
            pages: pageAction === "connect" 
              ? { connect: { id: pageId } }
              : { disconnect: { id: pageId } }
          }
        }));
      });
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No update data provided" }, { status: 400 });
    }

    await prisma.$transaction(updates as any);

    return NextResponse.json({ message: "Products updated successfully" });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ message: "Failed to update products" }, { status: 500 });
  }
}
