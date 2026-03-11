import { Brands, CatalogProducts, Products } from "@/lib/appwrite/types";
import { ID, Query, TablesDB } from "node-appwrite";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { config } from "dotenv";
import { createAdminClient } from "@/lib/appwrite/server";

config();
config({ path: ".env.local" });

async function main() {
  const { client } = await createAdminClient();

  const tables = new TablesDB(client);

  const { rows: products } = await tables.listRows<Products>({
    databaseId,
    tableId: tableIds.products,
    queries: [Query.equal("userId", "69a453620010b4b2114d"), Query.limit(200)],
    total: false,
  });

  const { rows: catalogProducts } = await tables.listRows<CatalogProducts>({
    databaseId,
    tableId: tableIds.catalogProducts,
    queries: [Query.limit(200)],
    total: false,
  });

  const { rows: brands } = await tables.listRows<Brands>({
    databaseId,
    tableId: tableIds.brands,
    queries: [Query.limit(200)],
    total: false,
  });

  for (const product of products) {
    const brand = brands.find((p) => p.name === product.brand);
    const catalogProduct = catalogProducts.find(
      (p) =>
        (p.brand as unknown as string) === brand?.$id &&
        p.name === product.name,
    );

    await tables.updateRow({
      databaseId,
      rowId: product.$id,
      tableId: tableIds.products,
      data: {
        catalogBrand: brand,
        catalogProduct,
      },
    });
  }
}

main();
