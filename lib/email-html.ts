export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPlainTextEmailHtml(text: string) {
  return `<pre style="white-space:pre-wrap;font:14px/1.7 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;margin:0;">${escapeHtml(text)}</pre>`;
}

export function sanitizeEmailHtml(source: string) {
  let blockedImages = 0;
  const cleaned = source
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[\s\S]*?>/gi, "")
    .replace(/<form\b[\s\S]*?<\/form>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\shref\s*=\s*["']\s*javascript:[^"']*["']/gi, ' href="#"')
    .replace(/<img\b[^>]*>/gi, (tag) => {
      blockedImages += 1;
      const alt = tag.match(/\salt\s*=\s*["']([^"']*)["']/i)?.[1];
      return `<div role="note" style="box-sizing:border-box;margin:10px 0;padding:12px 14px;border:1px solid #d1d5db;border-radius:10px;background:#f9fafb;color:#4b5563;font:13px/1.5 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Blocked email image${alt ? `: ${escapeHtml(alt)}` : ""}</div>`;
    });

  return {
    blockedImages,
    html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <base target="_blank" />
    <style>
      html, body { margin: 0; background: #ffffff; color: #111827; }
      body { padding: 20px; font: 14px/1.6 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      table { max-width: 100%; }
      a { color: #8a6a13; }
      * { max-width: 100%; box-sizing: border-box; }
    </style>
  </head>
  <body>${cleaned}</body>
</html>`
  };
}
