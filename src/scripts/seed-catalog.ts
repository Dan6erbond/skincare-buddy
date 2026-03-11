import { ID, Query, TablesDB } from "node-appwrite";
import { databaseId, tableIds } from "@/lib/appwrite/const";

import { Products } from "@/lib/appwrite/types";
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

  const brands: Record<string, string> = {};

  for (const product of products) {
    if (!(product.brand in brands)) {
      const rowId = ID.unique();

      await tables.createRow({
        databaseId,
        tableId: tableIds.brands,
        rowId,
        data: {
          name: product.brand,
        },
      });

      brands[product.brand] = rowId;
    }

    await tables.createRow({
      databaseId,
      tableId: tableIds.catalogProducts,
      rowId: ID.unique(),
      data: {
        name: product.name,
        category: product.category,
        brand: brands[product.brand],
      },
    });
  }
}

main();
