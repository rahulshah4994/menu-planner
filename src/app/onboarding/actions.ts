"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function encodeError(msg: string) {
  return `/onboarding?error=${encodeURIComponent(msg)}`;
}

export async function createFamily(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_family", { p_name: name });
  if (error) redirect(encodeError(error.message));
  redirect("/");
}

export async function joinFamily(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) redirect(encodeError("Enter a join code"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_family", { p_code: code });
  if (error) redirect(encodeError(error.message));
  redirect("/");
}
