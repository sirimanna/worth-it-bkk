import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import SearchBox from "@/app/components/SearchBox";

export const revalidate = 3600;

type Category = {
  name: string;
  slug: string;
  description: string | null;
};

type Place = {
  name: string;
  slug: string;
  verdict: "worth_it" | "skip" | "depends";
  score: number;
  category_slug: string;
  short_location: string | null;
};

function verdictLabel(v: Place["verdict"]) {
  if (v === "worth_it") return "Worth it ✅";
  if (v === "skip") return "Skip ❌";
  return "Depends ⚠️";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug, description")
    .order("name");

  // If user searches, show results. Otherwise show top picks.
  let places: Place[] | null = null;

  if (query.length > 0) {
    const { data } = await supabase
      .from("places")
      .select("name, slug, verdict, score, category_slug, short_location")
      .eq("published", true)
      .ilike("name", `%${query}%`)
      .order("score", { ascending: false })
      .limit(30);

    places = (data as Place[] | null) ?? [];
  } else {
    const { data } = await supabase
      .from("places")
      .select("name, slug, verdict, score, category_slug, short_location")
      .eq("published", true)
      .order("score", { ascending: false })
      .limit(12);

    places = (data as Place[] | null) ?? [];
  }

  return (
    <main style={{ padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>
          Is it worth it in Bangkok?
        </h1>
        <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
          Honest, quick decisions for travelers. No tourist-trap hype.
        </p>
      </header>

      <SearchBox initialQuery={query} />

      {/* Results */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          {query ? `Results for “${query}”` : "Top picks"}
        </h2>

        {places && places.length === 0 ? (
          <p style={{ opacity: 0.85 }}>
            No matches. Try another keyword like “Wat”, “Market”, “Rooftop”.
          </p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {places?.map((p) => (
              <li key={p.slug} style={{ marginBottom: 10 }}>
                <Link href={`/is-it-worth-it/${p.slug}`}>{p.name}</Link>{" "}
                <span style={{ opacity: 0.9 }}>
                  — <b>{verdictLabel(p.verdict)}</b> ({p.score}/10)
                  {p.short_location ? ` • ${p.short_location}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Categories */}
      <section>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Browse by category</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {(categories as Category[] | null)?.map((c) => (
            <Link
              key={c.slug}
              href={`/is-it-worth-it/category/${c.slug}`}
              style={{
                padding: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              {c.description && (
                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  {c.description}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: 36, opacity: 0.75 }}>
        <p>
          By <b>worth it in Bangkok</b>
        </p>
      </footer>
    </main>
  );
}