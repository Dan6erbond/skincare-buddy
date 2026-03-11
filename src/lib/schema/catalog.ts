import { z } from "zod";

/**
 * Brand Schema
 * Used for creating and updating master brands.
 */
export const BrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
  website: z.string().url("Must be a valid URL").nullable().or(z.literal("")), // Allows empty string for optional fields in HeroUI inputs
  logoUrl: z
    .string()
    .url("Must be a valid image URL")
    .nullable()
    .or(z.literal("")),
});

/**
 * Catalog Product Schema
 * Used for the master product library.
 */
export const CatalogProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(150),
  brandId: z.string().min(1, "Please select a brand"),
  category: z.string().min(1, "Please select a category"),
  description: z
    .string()
    .max(500, "Description too long")
    .nullable()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .url("Must be a valid image URL")
    .nullable()
    .or(z.literal("")),
});

export type BrandFormValues = z.infer<typeof BrandSchema>;
export type CatalogProductFormValues = z.infer<typeof CatalogProductSchema>;
