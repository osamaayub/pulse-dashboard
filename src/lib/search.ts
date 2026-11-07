/** Turns user text into an ILIKE pattern, escaping %, _ and \ so they match literally. */
export const likePattern = (text: string) => `%${text.replace(/[%_\\]/g, "\\$&")}%`;

/** "#123" or "123" means an id; anything else is a name or email search. */
export const idFromSearch = (text: string) => (/^#?\d{1,9}$/.test(text) ? Number(text.replace("#", "")) : null);
