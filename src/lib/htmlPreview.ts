/** Max HTML bytes/chars to scan (avoids huge regex work on very large bodies). */
const DEFAULT_MAX_HTML_INPUT = 8_192;

/** Plain-text preview length in the table cell. */
const DEFAULT_MAX_PREVIEW_CHARS = 90;

/**
 * Strip tags for admin table previews. Truncates input HTML before stripping, then truncates output.
 */
export function htmlPlainPreview(
  html: string | null | undefined,
  maxChars: number = DEFAULT_MAX_PREVIEW_CHARS,
  maxHtmlInput: number = DEFAULT_MAX_HTML_INPUT
): string {
  if (html == null) return "—";
  let s = String(html);
  if (!s.trim()) return "—";
  if (s.length > maxHtmlInput) s = s.slice(0, maxHtmlInput);
  const t = s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return "—";
  return t.length <= maxChars ? t : `${t.slice(0, maxChars)}…`;
}
