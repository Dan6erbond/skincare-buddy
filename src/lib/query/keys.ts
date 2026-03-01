export function products(): ["products"];

export function products(
  sortDirections: Record<string, "asc" | "desc">,
  page: number,
): ["products", Record<string, "asc" | "desc">, number];

export function products(
  sortDirections?: Record<string, "asc" | "desc">,
  page?: number,
) {
  return sortDirections ? ["products", sortDirections, page] : ["products"];
}

export const product = (id: string) => ["products", id] as const;

export const routines = () => ["routines"] as const;

export const routine = (id: string) => ["routines", id] as const;

export const step = (id: string) => ["steps", id] as const;
