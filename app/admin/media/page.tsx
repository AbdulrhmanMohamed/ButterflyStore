"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { fetchMediaList } from "@/lib/cloudinary";
import { Image, ExternalLink, Copy } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

interface MediaItem {
  name: string;
  url: string;
  path: string;
  createdTime: string;
}

export default function AdminMediaPage() {
  const { t } = useApp();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    (async () => {
      const items = await fetchMediaList();
      setMedia(items);
      setLoading(false);
    })();
  }, []);

  const filtered = media.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="text-center py-8 text-content-muted">{t("common.loading")}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-content mb-6">{t("admin.media")} ({media.length})</h1>

      <div className="bg-white rounded-lg shadow-sm border border-border/30 p-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("products.searchPlaceholder")}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-content placeholder:text-content-muted/50"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-content-muted">
          <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{t("common.noResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {paginated.map((item) => (
            <div key={item.path} className="bg-white rounded-lg shadow-sm border border-border/30 overflow-hidden group">
              <div className="aspect-square bg-surface relative">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => copyUrl(item.url)}
                    className="bg-white p-2 rounded-full hover:bg-surface transition"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4 text-content" />
                  </button>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full hover:bg-surface transition">
                    <ExternalLink className="w-4 h-4 text-content" />
                  </a>
                </div>
                {copied === item.url && (
                  <div className="absolute top-2 left-2 bg-success text-white text-xs px-2 py-1 rounded">Copied!</div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-content-muted truncate">{item.name}</p>
                <p className="text-[10px] text-content-muted/50">{new Date(item.createdTime).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
