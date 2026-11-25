import { exportCardNames } from "@/components/OgCard";
import { isPreviewEnv } from "@/content/env";

// Dev only: the names `pnpm cards` saves. Production answers 404.
export function GET() {
  if (!isPreviewEnv) return new Response(null, { status: 404 });
  return Response.json(exportCardNames());
}
