// Template mode (#4). Every piece of template copy goes through placeholder(),
// so `grep -rn "placeholder(" src/content` lists what content sync (#10) must
// replace. The real copy from before template mode is at git tag copy-v1.

export const placeholder = (text: string) => text;

/** Neutral media used until the evidence kits supply real covers and logos. */
export const placeholderMedia = {
  cover: "/placeholders/cover.svg",
  logo: "/placeholders/logo.svg",
};
