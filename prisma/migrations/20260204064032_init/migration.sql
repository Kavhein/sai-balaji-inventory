-- CreateTable
CREATE TABLE "Medicine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "unit_price" REAL NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "medicine_id" INTEGER NOT NULL,
    "quantity_sold" INTEGER NOT NULL,
    "total_price" REAL NOT NULL,
    "sale_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
