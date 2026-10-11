import { ImageResponse } from "next/og";

// App icons drawn in code (same mark as app/icon.svg), so there are no image files to keep in sync.
// Built once at build time. URLs end in .png, which the proxy lets through without sign-in.
const SIZES = {
  "192.png": { size: 192, maskable: false },
  "512.png": { size: 512, maskable: false },
  // Android crops maskable icons to a circle: full-bleed background, mark kept inside the middle 80%.
  "maskable-512.png": { size: 512, maskable: true },
  "apple-180.png": { size: 180, maskable: true }, // iOS rounds the corners itself
} as const;

export function generateStaticParams() {
  return Object.keys(SIZES).map((file) => ({ file }));
}

export async function GET(_req: Request, { params }: RouteContext<"/icons/[file]">) {
  const icon = SIZES[(await params).file as keyof typeof SIZES];
  if (!icon) return new Response("Not found", { status: 404 });
  const { size, maskable } = icon;
  const mark = maskable ? 0.36 : 0.47; // diamond width as a share of the icon

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1320",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100">
          <path d={`M${50 - mark * 60} 50h${mark * 120}`} stroke="#e4e7ef" strokeWidth="4.5" strokeLinecap="round" opacity="0.45" />
          <path d={`M50 ${50 - mark * 50}l${mark * 50} ${mark * 50}-${mark * 50} ${mark * 50}-${mark * 50}-${mark * 50}z`} fill="#7a93ff" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
