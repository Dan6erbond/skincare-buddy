export const APPWRITE_SESSION_KEY = "appwrite-session" as const;

export const databaseId = "skincare-buddy" as const;

export const tableIds = {
  products: "products",
  units: "units",
  routines: "routines",
  regiments: "regiments",
  steps: "steps",
  wishlist: "wishlist_products",
  profiles: "profiles",
  brands: "brands",
  catalogProducts: "catalog_products",
} as const;

export const teamIds = {
  admins: process.env.NEXT_PUBLIC_ADMIN_TEAM_ID!,
};
