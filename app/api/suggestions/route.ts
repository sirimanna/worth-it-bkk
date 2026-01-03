import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q || q.length < 2) {
    return Response.json({ items: [] });
  }

  const { data, error } = await supabase
    .from("places")
    .select("name, slug, score, verdict")
    .eq("published", true)
    .ilike("name", `%${q}%`)
    .order("score", { ascending: false })
    .limit(8);

  if (error) {
    return Response.json({ items: [], error: error.message }, { status: 500 });
  }

  return Response.json({ items: data ?? [] });
}