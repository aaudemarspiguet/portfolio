// Temporary switches for testing the room on a phone. A switch turns on with ?name=1 or #name in
// the address (several in the hash with commas, like #debug,runway), and is remembered on this
// device so it survives redirects and reloads. ?name=0 turns it off again.
export function debugFlag(name: string): boolean {
  if (typeof window === "undefined") return false;
  const key = `ln-flag:${name}`;
  const query = new URLSearchParams(window.location.search).get(name);
  const hash = window.location.hash.replace(/^#/, "").split(/[,&]/);
  try {
    if (query === "0") {
      localStorage.removeItem(key);
      return false;
    }
    if (query === "1" || hash.includes(name)) {
      localStorage.setItem(key, "1");
      return true;
    }
    return localStorage.getItem(key) === "1";
  } catch {
    return query === "1" || hash.includes(name);
  }
}
