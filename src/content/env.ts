/**
 * Drafts (case studies still in template copy) show in `next dev` and on Vercel preview
 * deployments, so they can be reviewed, and stay off the production site. Set
 * SHOW_DRAFTS=1 to include them in a local production build.
 */
export const showDrafts =
  process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview" || process.env.SHOW_DRAFTS === "1";
