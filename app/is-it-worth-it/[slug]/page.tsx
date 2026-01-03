import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 3600;

type FAQ = { q: string; a: string };

function verdictLabel(v: string) {
  if (v === "worth_it") return "Worth it ✅";
  if (v === "skip") return "Skip ❌";
  return "Depends ⚠️";
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: place } = await supabase
    .from("places")
    .select("*")
    .eq("published", true)
    .eq("slug", slug)
    .single();

  if (!place) return notFound();

  const faqs: FAQ[] = place.faqs ?? [];

  return (
    <main style={{ padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <p style={{ marginBottom: 16 }}>
        <Link href={`/is-it-worth-it/category/${place.category_slug}`}>
          ← Back to {place.category_slug}
        </Link>
      </p>

      <h1 style={{ fontSize: 34, marginBottom: 8 }}>{place.name}</h1>

      <p style={{ marginBottom: 18 }}>
        <b>{verdictLabel(place.verdict)}</b> • <b>{place.score}/10</b>
        {place.short_location ? ` • ${place.short_location}` : ""}
      </p>

      {place.summary && <p style={{ lineHeight: 1.6 }}>{place.summary}</p>}

      <hr style={{ margin: "22px 0", opacity: 0.2 }} />

      <h2>Worth it because</h2>
      <p style={{ lineHeight: 1.6 }}>{place.why_go ?? "Coming soon"}</p>

      <h2>Quick facts</h2>
      <ul>
        <li><b>Best time:</b> {place.best_time ?? "—"}</li>
        <li><b>Time needed:</b> {place.time_needed ?? "—"}</li>
        <li><b>Cost level:</b> {place.cost_level ?? "—"}</li>
        <li><b>Crowds:</b> {place.crowd_level ?? "—"}</li>
        <li><b>Tourist-trap risk:</b> {place.tourist_trap_risk ?? "—"}</li>
      </ul>

      {place.avoid_if && (
        <>
          <h2>Avoid if</h2>
          <p style={{ lineHeight: 1.6 }}>{place.avoid_if}</p>
        </>
      )}

      {place.alternatives && (
        <>
          <h2>Better alternatives</h2>
          <p style={{ lineHeight: 1.6 }}>{place.alternatives}</p>
        </>
      )}

      {place.google_maps_url && (
        <p>
          <a href={place.google_maps_url} target="_blank" rel="noreferrer">
            Open in Google Maps →
          </a>
        </p>
      )}

      {faqs.length > 0 && (
        <>
          <h2>FAQ</h2>
          {faqs.map((f, i) => (
            <details key={i} style={{ marginBottom: 10 }}>
              <summary style={{ cursor: "pointer" }}>{f.q}</summary>
              <p style={{ marginTop: 6 }}>{f.a}</p>
            </details>
          ))}
        </>
      )}
    </main>
  );
}