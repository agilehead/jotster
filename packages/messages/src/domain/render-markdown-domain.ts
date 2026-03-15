import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";

const escapeHtml = (text: string): string => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "&") {
      result = result + "&amp;";
    } else if (ch === "<") {
      result = result + "&lt;";
    } else if (ch === ">") {
      result = result + "&gt;";
    } else if (ch === '"') {
      result = result + "&quot;";
    } else {
      result = result + ch;
    }
  }
  return result;
};

const renderInline = (text: string): string => {
  // Handle inline code: `code`
  let result = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "`") {
      const start = i + 1;
      let end = text.indexOf("`", start);
      if (end === -1) {
        result = result + text[i];
        i = i + 1;
      } else {
        const code = escapeHtml(text.substring(start, end));
        result = result + "<code>" + code + "</code>";
        i = end + 1;
      }
    } else if (text[i] === "*" && i + 1 < text.length && text[i + 1] === "*") {
      // Bold: **text**
      const start = i + 2;
      const end = text.indexOf("**", start);
      if (end === -1) {
        result = result + text[i];
        i = i + 1;
      } else {
        const bold = escapeHtml(text.substring(start, end));
        result = result + "<strong>" + bold + "</strong>";
        i = end + 2;
      }
    } else if (text[i] === "*") {
      // Italic: *text*
      const start = i + 1;
      let end = -1;
      for (let j = start; j < text.length; j++) {
        if (text[j] === "*" && (j + 1 >= text.length || text[j + 1] !== "*")) {
          end = j;
          break;
        }
      }
      if (end === -1) {
        result = result + text[i];
        i = i + 1;
      } else {
        const italic = escapeHtml(text.substring(start, end));
        result = result + "<em>" + italic + "</em>";
        i = end + 1;
      }
    } else {
      result = result + escapeHtml(text[i]);
      i = i + 1;
    }
  }
  return result;
};

export const renderMarkdownDomain = (
  content: string,
): Result<{ rendered: string }, string> => {
  if (content.length === 0) {
    return ok({ rendered: "" });
  }

  // Split content into paragraphs by double newlines
  const lines = content.split("\n");
  let rendered = "";
  let currentParagraph = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) {
      if (currentParagraph.length > 0) {
        rendered = rendered + "<p>" + renderInline(currentParagraph) + "</p>\n";
        currentParagraph = "";
      }
    } else {
      if (currentParagraph.length > 0) {
        currentParagraph = currentParagraph + " " + line;
      } else {
        currentParagraph = line;
      }
    }
  }

  if (currentParagraph.length > 0) {
    rendered = rendered + "<p>" + renderInline(currentParagraph) + "</p>";
  }

  return ok({ rendered });
};
