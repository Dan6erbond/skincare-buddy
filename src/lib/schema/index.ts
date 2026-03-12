import { CalendarDate, ZonedDateTime } from "@internationalized/date";

import { UnitsPeriodAfterOpeningUnit } from "@/lib/appwrite/types";
import z from "zod";

export const calendarDateSchema = z.custom<CalendarDate>(
  (val) => val instanceof CalendarDate,
  { message: "Invalid date" },
);

export const zonedDateTimeSchema = z.custom<ZonedDateTime>(
  (val) => val instanceof ZonedDateTime,
  { message: "Invalid date" },
);

export const UnitSchema = z.object({
  purchaseDate: calendarDateSchema
    .nullish()
    .refine((val) => (val ? val.year > 1970 : true)),
  expiresAt: calendarDateSchema
    .nullish()
    .refine((val) => (val ? val.year > 1970 : true)),
  openedAt: calendarDateSchema
    .nullish()
    .refine((val) => (val ? val.year > 1970 : true)),
  periodAfterOpeningDuration: z.number().nullish(),
  periodAfterOpeningUnit: z
    .enum(UnitsPeriodAfterOpeningUnit)
    .default(UnitsPeriodAfterOpeningUnit.MONTHS)
    .nullish(),
});

export type UnitFormValues = z.infer<typeof UnitSchema>;

export const ProductSchema = z.object({
  name: z.string().min(1, "Required").max(100),
  brand: z.string().min(1, "Required").max(100),
  category: z.string().min(1, "Required"),
  price: z.number().min(0),
  description: z.string().nullish(),
  units: z.array(UnitSchema).min(1, "Add at least one unit").nullish(),
  catalogProduct: z.string().nullish(),
  catalogBrand: z.string().nullish(),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

export const CreateRoutineSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(200).optional(),
});

export type CreateRoutineValues = z.infer<typeof CreateRoutineSchema>;

export const CreateStepSchema = z.object({
  name: z.string().min(1, "Step name is required"),
  description: z.string().nullish(),
  productIds: z.array(z.string()).min(1, "Select at least one product"),
});

export type CreateStepValues = z.infer<typeof CreateStepSchema>;

export const JournalEntrySchema = z.object({
  occurredAt: zonedDateTimeSchema,
  description: z.string().optional(),
  // For the file, we handle the ID separately or via state during the upload
  imageId: z.string().nullish(),
  image: z
    .union([z.instanceof(File), z.string()])
    .nullable()
    .optional(),
});

export type JournalEntryFormValues = z.infer<typeof JournalEntrySchema>;
