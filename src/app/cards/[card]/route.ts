import { exportCard } from "@/components/OgCard";
import { isPreviewEnv } from "@/content/env";

// Dev only: one share card as a PNG, for `pnpm cards`. Production answers 404.
export async function GET(_request: Request, { params }: RouteContext<"/cards/[card]">) {
  const card = isPreviewEnv ? await exportCard((await params).card) : null;
  return card ?? new Response(null, { status: 404 });
}
