"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { nextStatus } from "@/lib/progress";
import { requireUser } from "@/lib/supabase/server";

// The table name comes from the form, so only these three are accepted.
const statusSchema = z.object({
  table: z.enum(["skills", "courses", "projects"]),
  id: z.uuid(),
  status: z.enum(["not_started", "in_progress", "done"]),
});

export async function cycleStatus(formData: FormData) {
  const { table, id, status } = statusSchema.parse(Object.fromEntries(formData));
  const { supabase } = await requireUser();
  // RLS makes sure this row belongs to the signed-in user.
  const { error } = await supabase.from(table).update({ status: nextStatus(status) }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

const goalSchema = z.object({ id: z.uuid(), done: z.enum(["true", "false"]) });

export async function toggleGoal(formData: FormData) {
  const { id, done } = goalSchema.parse(Object.fromEntries(formData));
  const { supabase } = await requireUser();
  const { error } = await supabase.from("goals").update({ done: done !== "true" }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
