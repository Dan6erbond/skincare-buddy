export const APPWRITE_SESSION_KEY = "appwrite-session" as const;

export const databaseId = "skincare-buddy" as const;

export const tableIds = {
  products: "products",
  units: "units",
  routines: "routines",
  regiments: "regiments",
  steps: "steps",
  wishlist: "wishlist_products",
} as const;
