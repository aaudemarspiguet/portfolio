import "server-only";

/**
 * Drafts (case studies still in template copy) stay off by default, including in
 * `next dev` and previews. Set SHOW_DRAFTS=1 to include them locally.
 */
export const showDrafts = process.env.SHOW_DRAFTS === "1";

/** Dev, Vercel preview, and draft-enabled builds stay unindexed. */
export const isPreviewEnv =
  process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview" || showDrafts;
