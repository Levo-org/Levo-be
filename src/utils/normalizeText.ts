export function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}
