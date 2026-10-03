import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/app-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const user = await getCurrentProfile(); const admin = getSupabaseAdminClient();
  if (!user || user.role !== "customer") return NextResponse.json({ error: "Please sign in before uploading evidence." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image smaller than 5 MB." }, { status: 400 });
  const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const { error } = await admin.storage.from("return-evidence").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: "Evidence upload failed." }, { status: 500 });
  return NextResponse.json({ path, contentType: file.type });
}
