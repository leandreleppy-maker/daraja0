// DARAJA — Search Results dropdown (live search)
'use client';

import { useEffect, useRef, useState } from "react";
import { Search, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { api, timeAgo } from "@/lib/client";

type Doc = {
  id: string;
  title: string;
  type: string;
  aiCategory: string | null;
  sizeFormatted: string;
  createdAt: string;
};

export function SearchResults({
  query, onClose, onPicked,
}: {
  query: string;
  onClose: () => void;
  onPicked: () => void;
}) {
  const [results, setResults] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await api<{ items: Doc[] }>(`/api/documents/search?q=${encodeURIComponent(query)}&limit=10`);
        setResults(data.items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[440px] overflow-y-auto daraja-scroll"
    >
      <div className="p-2.5 border-b border-border flex items-center justify-between">
        <div className="text-xs text-foreground/60 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" />
          {loading ? "Recherche…" : `${results.length} résultat(s) pour « ${query} »`}
        </div>
        <button onClick={onClose} className="text-foreground/40 hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-sm text-foreground/50">
          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" />
          DARAJA Brain cherche…
        </div>
      ) : results.length === 0 ? (
        <div className="p-6 text-center text-sm text-foreground/50">
          <FileText className="w-8 h-8 mx-auto mb-2 text-foreground/30" />
          Aucun document trouvé pour « {query} ».
          <div className="text-[11px] mt-1">Essayez : Contrat, Facture, Marché Public, 2026…</div>
        </div>
      ) : (
        <div className="py-1">
          {results.map((d) => (
            <button
              key={d.id}
              onClick={() => { onPicked(); onClose(); }}
              className="w-full flex items-center gap-3 p-2.5 hover:bg-muted text-left"
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                d.type === "pdf" ? "bg-primary/10 text-primary" :
                d.type === "image" ? "bg-success/10 text-success" :
                "bg-gold/15 text-accent-foreground"
              }`}>
                {d.type === "image" ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{d.title}</div>
                <div className="text-[11px] text-foreground/50 truncate">
                  {d.aiCategory} · {d.sizeFormatted} · {timeAgo(d.createdAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="p-2 border-t border-border bg-muted/30 text-[11px] text-foreground/50 text-center">
        🔍 Recherche full-text dans titre, catégorie IA, tags et OCR
      </div>
    </div>
  );
}
