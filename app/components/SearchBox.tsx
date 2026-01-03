"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = {
  name: string;
  slug: string;
  score: number;
  verdict: "worth_it" | "skip" | "depends";
};

function verdictIcon(v: Suggestion["verdict"]) {
  if (v === "worth_it") return "✅";
  if (v === "skip") return "❌";
  return "⚠️";
}

export default function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Fetch suggestions (debounced)
  useEffect(() => {
    const q = value.trim();

    // Reset if short
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(q)}`, {
          signal: abortRef.current.signal,
        });
        const json = await res.json();

        setItems(json.items ?? []);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        // ignore abort errors
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return router.push("/");
    router.push(`/?q=${encodeURIComponent(q)}`);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      // If a suggestion is highlighted, go to it
      if (activeIndex >= 0) {
        e.preventDefault();
        router.push(`/is-it-worth-it/${items[activeIndex].slug}`);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", gap: 10, alignItems: "center" }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a place… (e.g., Wat Arun, Chatuchak)"
          aria-label="Search places"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            outline: "none",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.10)",
            color: "inherit",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "…" : "Search"}
        </button>

        {value.trim() && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setItems([]);
              setOpen(false);
              router.push("/");
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Clear
          </button>
        )}
      </form>

      {open && items.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(20,20,20,0.98)",
            overflow: "hidden",
            zIndex: 20,
          }}
        >
          {items.map((it, idx) => (
            <Link
              key={it.slug}
              href={`/is-it-worth-it/${it.slug}`}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                textDecoration: "none",
                color: "inherit",
                background:
                  idx === activeIndex ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              <span>
                {verdictIcon(it.verdict)} {it.name}
              </span>
              <span style={{ opacity: 0.75 }}>{it.score}/10</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}