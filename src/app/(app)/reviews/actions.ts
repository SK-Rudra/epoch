"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { dhakaDate, weekStart } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";

export type ReviewState = { saved?: boolean; error?: string };

// Same limits as the weekly_reviews checks in supabase/migrations/0001_init.sql.
const reviewSchema = z.object({
  week_start: z.iso
    .date()
    .refine((d) => d === weekStart(d), "week must start on a Sunday")
    .refine((d) => d <= weekStart(dhakaDate()), "can't review a future week"),
  wins: z.string().trim().max(2000),
  blockers: z.string().trim().max(2000),
  next_week_priorities: z.array(z.string().trim().max(200)).max(3),
  mood: z.coerce.number().int().min(1).max(5),
});

export async function saveReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse({
    ...Object.fromEntries(formData),
    // Three "priority" inputs; blank ones are dropped.
    next_week_priorities: formData.getAll("priority").map(String).filter((p) => p.trim()),
  });
  if (!parsed.success) return { error: "Pick a mood (1–5) and keep each answer under the length limit." };

  const { supabase } = await requireUser();
  // One review per week: saving again overwrites that week's review.
  const { error } = await supabase
    .from("weekly_reviews")
    .upsert(parsed.data, { onConflict: "user_id,week_start" });
  if (error) return { error: `Could not save: ${error.message}` };

  refresh();
  return { saved: true };
}
