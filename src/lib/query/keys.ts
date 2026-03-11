export function products(): ["products"];

export function products(props: {
  sortDirections: Record<string, "asc" | "desc">;
  page: number;
  perPage: number;
  search: string;
  showArchived: boolean;
}): ["products", typeof props];

export function products(props?: {
  sortDirections: Record<string, "asc" | "desc">;
  page: number;
  perPage: number;
  search: string;
  showArchived: boolean;
}) {
  return props ? ["products", props] : ["products"];
}

export const product = (id: string) => ["products", id] as const;

export const routines = () => ["routines"] as const;

export const routine = (id: string) => ["routines", id] as const;

export const step = (id: string) => ["steps", id] as const;

export function wishlist(props?: {
  isDeleted?: boolean;
  hasName?: boolean;
}): ["wishlist", typeof props] | ["wishlist"] {
  return props ? ["wishlist", props] : ["wishlist"];
}

export const profile = (userId?: string) => ["profile", userId] as const;

export const userTeamMemberships = (userId: string, teamId: string) =>
  ["memberships", userId, teamId] as const;

export function adminBrands(): ["admin", "brands"];

export function adminBrands<
  T extends { search?: string; page?: number; perPage?: number },
>(filters: T): ["admin", "brands", T];

export function adminBrands(filters?: object) {
  const base = ["admin", "brands"] as const;
  return filters ? [...base, filters] : base;
}

export function adminCatalog(): ["admin", "catalog"];

export function adminCatalog<
  T extends {
    search?: string;
    brandId?: string;
    page?: number;
    perPage?: number;
  },
>(filters: T): ["admin", "catalog", T];

export function adminCatalog(filters?: object) {
  const base = ["admin", "catalog"] as const;
  return filters ? [...base, filters] : base;
}
