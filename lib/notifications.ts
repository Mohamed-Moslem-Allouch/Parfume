import { prisma } from "@/lib/prisma";

export async function createNotification(input: {
  type?: string;
  title: string;
  message: string;
  href?: string | null;
}) {
  try {
    await prisma.notification.create({
      data: {
        type: input.type || "INFO",
        title: input.title,
        message: input.message,
        href: input.href || null
      }
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }
}
