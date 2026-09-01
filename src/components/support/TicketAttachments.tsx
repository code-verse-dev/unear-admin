import { useState } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { resolveMediaUrl } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i;

function rawUrls(attachments: unknown): string[] {
  if (!Array.isArray(attachments)) return [];
  const out: string[] = [];
  for (const item of attachments) {
    if (typeof item === "string" && item.trim()) out.push(item.trim());
    else if (item && typeof item === "object" && "url" in item && typeof (item as { url: unknown }).url === "string") {
      const t = String((item as { url: string }).url).trim();
      if (t) out.push(t);
    }
  }
  return out.map((u) => resolveMediaUrl(u)).filter((u): u is string => Boolean(u));
}

function fileName(url: string) {
  try {
    const path = new URL(url, "https://local").pathname;
    return decodeURIComponent(path.split("/").pop() || "file");
  } catch {
    return url.split("/").pop() || "file";
  }
}

export function TicketAttachments({
  attachments,
  compact = false,
}: {
  attachments: unknown;
  compact?: boolean;
}) {
  const urls = rawUrls(attachments);
  const [preview, setPreview] = useState<string | null>(null);

  if (!urls.length) return compact ? null : <p className="text-sm text-muted-foreground">No attachments</p>;

  const downloadAll = () => {
    urls.forEach((url, i) => {
      window.setTimeout(() => {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.download = fileName(url);
        a.click();
      }, i * 200);
    });
  };

  if (compact) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          {urls.map((url) =>
            IMAGE_EXT.test(url) ? (
              <button
                key={url}
                type="button"
                className="h-12 w-12 overflow-hidden rounded-md border border-border"
                onClick={() => setPreview(url)}
                title={fileName(url)}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ) : (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="max-w-[140px] truncate">{fileName(url)}</span>
              </a>
            )
          )}
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={downloadAll}>
            <Download className="mr-1 h-3.5 w-3.5" />
            All
          </Button>
        </div>
        <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
          <DialogContent className="max-w-3xl p-2">
            <DialogTitle className="sr-only">Attachment preview</DialogTitle>
            {preview ? <img src={preview} alt="" className="max-h-[80vh] w-full rounded object-contain" /> : null}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button type="button" size="sm" variant="outline" onClick={downloadAll}>
          <Download className="mr-1 h-3.5 w-3.5" />
          Download all
        </Button>
      </div>
      <ul className="space-y-2">
        {urls.map((url) => (
          <li
            key={url}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            {IMAGE_EXT.test(url) ? (
              <button
                type="button"
                className="h-12 w-12 shrink-0 overflow-hidden rounded border border-border"
                onClick={() => setPreview(url)}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ) : (
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm">{fileName(url)}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName(url)}
              className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </li>
        ))}
      </ul>
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Attachment preview</DialogTitle>
          {preview ? <img src={preview} alt="" className="max-h-[80vh] w-full rounded object-contain" /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
