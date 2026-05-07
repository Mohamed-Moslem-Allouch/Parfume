-- CreateTable
CREATE TABLE "VisualCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisualCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "VisualCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT NOT NULL DEFAULT '[]',
    "videos" TEXT NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "bestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "topNotes" TEXT NOT NULL DEFAULT '[]',
    "heartNotes" TEXT NOT NULL DEFAULT '[]',
    "baseNotes" TEXT NOT NULL DEFAULT '[]',
    "accords" TEXT NOT NULL DEFAULT '[]',
    "type" TEXT NOT NULL DEFAULT 'PERFUME',
    "categoryId" TEXT NOT NULL,
    "visualCategoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_visualCategoryId_fkey" FOREIGN KEY ("visualCategoryId") REFERENCES "VisualCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("accords", "baseNotes", "bestSeller", "categoryId", "createdAt", "description", "featured", "heartNotes", "id", "images", "isNew", "name", "price", "slug", "stock", "topNotes", "type", "updatedAt", "videos") SELECT "accords", "baseNotes", "bestSeller", "categoryId", "createdAt", "description", "featured", "heartNotes", "id", "images", "isNew", "name", "price", "slug", "stock", "topNotes", "type", "updatedAt", "videos" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_visualCategoryId_idx" ON "Product"("visualCategoryId");
CREATE INDEX "Product_slug_idx" ON "Product"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VisualCategory_name_key" ON "VisualCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VisualCategory_slug_key" ON "VisualCategory"("slug");

-- CreateIndex
CREATE INDEX "VisualCategory_parentId_idx" ON "VisualCategory"("parentId");
