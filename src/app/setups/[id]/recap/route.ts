import { notFound } from "next/navigation";
import { getSetupDetail } from "@/db/queries";
import { renderSetupRecap } from "@/lib/setup-images";

/** Recap image for the setup owner (route sits behind the auth proxy). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await getSetupDetail(Number(id));
  if (!detail) notFound();

  const image = renderSetupRecap(detail);
  const slug = detail.setup.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "setup";
  image.headers.set("Content-Disposition", `inline; filename="${slug}-recap.png"`);
  image.headers.set("Cache-Control", "no-store");
  return image;
}
