export function sanitizeRichTextHtml(input?: string | null) {
  if (!input) return "";

  let html = input;
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  html = html.replace(/\son\w+="[^"]*"/gi, "");
  html = html.replace(/\son\w+='[^']*'/gi, "");
  html = html.replace(/javascript:/gi, "");
  return html.trim();
}

export function richTextToPlain(input?: string | null) {
  if (!input) return "";
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
