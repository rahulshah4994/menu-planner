"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

async function getOrigin() {
  const hdrs = await headers();
  return (
    hdrs.get("origin") ??
    `https://${hdrs.get("host") ?? "localhost:3000"}`
  );
}

function encodeError(msg: string) {
  return `/login?error=${encodeURIComponent(msg)}`;
}

export async function signInMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect(encodeError("Email is required"));

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(encodeError(error.message));
  redirect("/login/check-email");
}

export async function signInPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect(encodeError("Email and password are required"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) redirect(encodeError(error.message));
  redirect("/");
}
