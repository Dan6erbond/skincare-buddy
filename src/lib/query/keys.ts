export function products(): ["products"];

export function products(
  sortDirections: Record<string, "asc" | "desc">,
): ["products", Record<string, "asc" | "desc">];

export function products(sortDirections?: Record<string, "asc" | "desc">) {
  return sortDirections ? ["products", sortDirections] : ["products"];
}

export const product = (id: string) => ["products", id] as const;

export const routines = () => ["routines"] as const;

export const routine = (id: string) => ["routines", id] as const;

export const step = (id: string) => ["steps", id] as const;
