import { ImageResponse } from "next/og";
import { getSetupDetailByShareToken } from "@/db/queries";
import { OG_COLORS, OG_SIZE } from "@/lib/og";
import { renderSetupOg } from "@/lib/setup-images";
import { SITE_NAME } from "@/lib/site";

export const alt = "Bikepacking setup overview";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const detail = await getSetupDetailByShareToken(token);

  if (!detail) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: OG_COLORS.background,
            color: OG_COLORS.ink,
            fontSize: 64,
          }}
        >
          {SITE_NAME}
        </div>
      ),
      size,
    );
  }

  return renderSetupOg(detail);
}
