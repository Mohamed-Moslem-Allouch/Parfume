import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { slugify } from "../lib/format";

const categories = ["Oud", "Floral", "Woody", "Musk"];

const products = [
  {
    name: "Royal Saffron Oud",
    description:
      "A deep oud perfume layered with saffron, resin, and a warm amber trail. Made for evenings, celebrations, and lasting first impressions.",
    variants: [
      { name: "50 ml", price: 129, stock: 18, isDefault: true },
      { name: "100 ml", price: 219, stock: 10, isDefault: false }
    ],
    category: "Oud",
    images: ["/products/royal-saffron-oud.svg"],
    featured: true
  },
  {
    name: "Rose Damas Nocturne",
    description:
      "Velvety Damask rose brightened with pink pepper and softened by vanilla musk. Elegant, romantic, and polished.",
    variants: [
      { name: "50 ml", price: 92, stock: 24, isDefault: true },
      { name: "100 ml", price: 164, stock: 14, isDefault: false }
    ],
    category: "Floral",
    images: ["/products/rose-damas-nocturne.svg"],
    featured: true
  },
  {
    name: "Cedar Amber Veil",
    description:
      "Clean cedar, golden amber, and a trace of incense create a modern woody fragrance with calm projection.",
    variants: [
      { name: "50 ml", price: 105, stock: 15, isDefault: true },
      { name: "100 ml", price: 188, stock: 8, isDefault: false }
    ],
    category: "Woody",
    images: ["/products/cedar-amber-veil.svg"],
    featured: true
  },
  {
    name: "Musk Al Noor",
    description:
      "A luminous white musk with pear blossom, soft sandalwood, and a tender skin-like finish for everyday luxury.",
    variants: [
      { name: "50 ml", price: 76, stock: 30, isDefault: true },
      { name: "100 ml", price: 140, stock: 16, isDefault: false }
    ],
    category: "Musk",
    images: ["/products/musk-al-noor.svg"],
    featured: false
  },
  {
    name: "Jasmine Smoke",
    description:
      "Night-blooming jasmine over smoked woods and tonka. Floral at first, mysterious as it settles.",
    variants: [
      { name: "50 ml", price: 98, stock: 12, isDefault: true },
      { name: "100 ml", price: 176, stock: 7, isDefault: false }
    ],
    category: "Floral",
    images: ["/products/jasmine-smoke.svg"],
    featured: false
  },
  {
    name: "Velvet Incense",
    description:
      "A ceremonial blend of frankincense, black tea, cedar, and golden labdanum with a plush drydown.",
    variants: [
      { name: "50 ml", price: 118, stock: 9, isDefault: true },
      { name: "100 ml", price: 210, stock: 5, isDefault: false }
    ],
    category: "Woody",
    images: ["/products/velvet-incense.svg"],
    featured: true
  }
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME || "Store Admin";

  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {
      name: adminName,
      password: await bcrypt.hash(adminPassword, 12)
    },
    create: {
      email: adminEmail.toLowerCase(),
      name: adminName,
      password: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN"
    }
  });

  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(categoryName) },
      update: { name: categoryName },
      create: {
        name: categoryName,
        slug: slugify(categoryName)
      }
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: slugify(product.category) }
    });

    await prisma.product.upsert({
      where: { slug: slugify(product.name) },
      update: {
        name: product.name,
        description: product.description,
        price: Math.min(...product.variants.map((variant) => variant.price)),
        stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
        images: JSON.stringify(product.images),
        videos: JSON.stringify([]),
        featured: product.featured,
        categoryId: category.id,
        variants: {
          deleteMany: {},
          create: product.variants
        }
      },
      create: {
        name: product.name,
        slug: slugify(product.name),
        description: product.description,
        price: Math.min(...product.variants.map((variant) => variant.price)),
        stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
        images: JSON.stringify(product.images),
        videos: JSON.stringify([]),
        featured: product.featured,
        categoryId: category.id,
        variants: {
          create: product.variants
        }
      }
    });
  }

  const page = await prisma.page.upsert({
    where: { slug: "signature-oud-edit" },
    update: {
      title: "Signature Oud Edit",
      excerpt: "A curated page for rich oud and incense perfumes.",
      content: "Build custom storefront pages from the admin panel and choose exactly which products appear here.",
      published: true
    },
    create: {
      title: "Signature Oud Edit",
      slug: "signature-oud-edit",
      excerpt: "A curated page for rich oud and incense perfumes.",
      content: "Build custom storefront pages from the admin panel and choose exactly which products appear here.",
      published: true
    }
  });

  const oudProducts = await prisma.product.findMany({
    where: {
      category: { slug: "oud" }
    },
    select: { id: true }
  });

  await prisma.page.update({
    where: { id: page.id },
    data: {
      products: {
        set: oudProducts.map((product) => ({ id: product.id }))
      }
    }
  });

  const menuItems = await prisma.menuItem.count();

  if (menuItems === 0) {
    await prisma.menuItem.createMany({
      data: [
        { label: "Home", href: "/", type: "INTERNAL", position: 0, visible: true },
        { label: "Shop", href: "/shop", type: "INTERNAL", position: 1, visible: true },
        { label: "Cart", href: "/cart", type: "INTERNAL", position: 2, visible: true }
      ]
    });

    await prisma.menuItem.create({
      data: {
        label: "Signature Oud",
        type: "PAGE",
        pageId: page.id,
        position: 3,
        visible: true
      }
    });
  }

  const productsWithoutVariants = await prisma.product.findMany({
    where: {
      variants: {
        none: {}
      }
    }
  });

  for (const product of productsWithoutVariants) {
    const basePrice = Number(product.price.toString());

    await prisma.productVariant.createMany({
      data: [
        {
          productId: product.id,
          name: "50 ml",
          price: basePrice,
          stock: product.stock,
          isDefault: true
        },
        {
          productId: product.id,
          name: "100 ml",
          price: Math.round(basePrice * 1.8 * 1000) / 1000,
          stock: 0,
          isDefault: false
        }
      ]
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
