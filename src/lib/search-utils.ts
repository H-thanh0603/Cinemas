/** Escape SQL LIKE wildcards (% and _) in search terms to prevent wildcard injection. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
