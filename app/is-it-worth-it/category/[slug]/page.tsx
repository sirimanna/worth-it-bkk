import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 3600;

type Place = {
  name: string;
  slug: string;
  verdict: "worth_it" | "skip" | "depends";
  score: number;
  short_location: string | null;
  category_slug: string;
};

function verdictLabel(v: Place["verdict"]) {
  if (v === "worth_it") return "Worth it ✅";
  if (v === "skip") return "Skip ❌";
  return "Depends ⚠️";
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: categorySlug } = await params;

  const { data: category } = await supabase
    .from("categories")
    .select("name, slug, description")
    .eq("slug", categorySlug)
    .single();

  const { data: places } = await supabase
    .from("places")
    .select("name, slug, verdict, score, short_location, category_slug")
    .eq("published", true)
    .eq("category_slug", categorySlug)
    .order("score", { ascending: false });

  return (
    <main style={{ padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <p style={{ marginBottom: 16 }}>
        <Link href="/">← Home</Link>
      </p>

      <h1 style={{ fontSize: 32, marginBottom: 8 }}>
        {category?.name ?? categorySlug}
      </h1>
      {category?.description && (
        <p style={{ opacity: 0.9, marginBottom: 20 }}>
          {category.description}
        </p>
      )}

      <ul style={{ paddingLeft: 18 }}>
        {(places as Place[] | null)?.map((p) => (
          <li key={p.slug} style={{ marginBottom: 10 }}>
            <Link href={`/is-it-worth-it/${p.slug}`}>{p.name}</Link>{" "}
            <span style={{ opacity: 0.9 }}>
              — <b>{verdictLabel(p.verdict)}</b> ({p.score}/10)
              {p.short_location ? ` • ${p.short_location}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}