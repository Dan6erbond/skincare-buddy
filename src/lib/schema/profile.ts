"use client";

import * as z from "zod";

import { ProfilesSkinType } from "@/lib/appwrite/appwrite";

export const ProfileSchema = z.object({
  skinType: z.enum(ProfilesSkinType).optional(),
  hasSensitiveSkin: z.boolean().default(false).optional(),
  skinIssues: z
    .array(
      z.object({
        value: z.string().min(1, "Required"),
      }),
    )
    .default([])
    .optional(),
});
export type ProfileFormValues = z.infer<typeof ProfileSchema>;
