export function products(): ["products"];

export function products(props: {
  sortDirections: Record<string, "asc" | "desc">;
  page: number;
  perPage: number;
  search: string;
}): ["products", typeof props];

export function products(props?: {
  sortDirections: Record<string, "asc" | "desc">;
  page: number;
  perPage: number;
  search: string;
}) {
  return props ? ["products", props] : ["products"];
}

export const product = (id: string) => ["products", id] as const;

export const routines = () => ["routines"] as const;

export const routine = (id: string) => ["routines", id] as const;

export const step = (id: string) => ["steps", id] as const;
