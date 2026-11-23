import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Aswin — Platform PM who builds for agents";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({ title: "Platform PM who builds for agents.", eyebrow: "ASWIN A" });
}
