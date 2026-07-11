import { notFound } from "next/navigation";
import { getSetupDetailByShareToken } from "@/db/queries";
import { renderSetupRecap } from "@/lib/setup-images";

/** Public recap image — anyone with the share link can view/save it. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const detail = await getSetupDetailByShareToken(token);
  if (!detail) notFound();

  const image = renderSetupRecap(detail);
  const slug = detail.setup.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "setup";
  image.headers.set("Content-Disposition", `inline; filename="${slug}-recap.png"`);
  image.headers.set("Cache-Control", "no-store");
  return image;
}
