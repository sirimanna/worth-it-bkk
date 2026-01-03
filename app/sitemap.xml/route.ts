import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const baseUrl = "http://localhost:3000"; // later replace with your domain

  const { data: places } = await supabase
    .from("places")
    .select("slug")
    .eq("published", true);

  const { data: categories } = await supabase
    .from("categories")
    .select("slug");

  const urls: string[] = [];
  urls.push(`${baseUrl}/`);
  urls.push(`${baseUrl}/is-it-worth-it`);

  (categories ?? []).forEach((c) =>
    urls.push(`${baseUrl}/is-it-worth-it/category/${c.slug}`)
  );

  (places ?? []).forEach((p) =>
    urls.push(`${baseUrl}/is-it-worth-it/${p.slug}`)
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}