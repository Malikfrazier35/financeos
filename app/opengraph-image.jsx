import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Castford — AI-Native FP&A Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ background: "#F8F9FC", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, transparent, #C4884A 30%, #C4884A 70%, transparent)", display: "flex" }} />
        <div style={{ position: "absolute", top: "-25%", right: "-15%", width: "65%", height: "65%", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,127,204,0.08) 0%, transparent 70%)", display: "flex" }} />
        <svg width="120" height="120" viewBox="0 0 100 100" style={{ marginBottom: 28 }}>
          <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" fill="none" stroke="#5B7FCC" strokeWidth="1.4" opacity="0.35" />
          <path d="M50 16 L80 33 L80 67 L50 84 L20 67 L20 33 Z" fill="none" stroke="#5B7FCC" strokeWidth="3" />
          <path d="M36 47 L50 39 L64 47 L64 57 L50 65 L36 57 Z" fill="none" stroke="#C4884A" strokeWidth="2" />
          <circle cx="50" cy="52" r="4" fill="#C4884A" />
        </svg>
        <div style={{ fontSize: 72, fontWeight: 400, color: "#0A1F3D", letterSpacing: "-0.02em", marginBottom: 14, fontFamily: "Georgia, 'Times New Roman', serif", display: "flex" }}>Castford</div>
        <div style={{ fontSize: 24, color: "#475569", fontWeight: 500, marginBottom: 44, letterSpacing: "-0.01em", display: "flex" }}>The AI-native FP&A platform</div>
        <div style={{ display: "flex", gap: 56, padding: "22px 52px", borderRadius: 12, border: "1px solid rgba(91,127,204,0.22)", background: "rgba(255,255,255,0.7)" }}>
          {[
            { value: "30+", label: "Integrations" },
            { value: "<48hr", label: "Implementation" },
            { value: "$599/mo", label: "Starter Plan" },
            { value: "SOC 2", label: "Compliant" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#C4884A", letterSpacing: "-0.02em", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}>{item.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginTop: 4, letterSpacing: "0.02em" }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 36, fontSize: 15, color: "#5B7FCC", fontWeight: 600, letterSpacing: "0.06em", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", display: "flex" }}>castford.com</div>
      </div>
    ),
    { ...size }
  );
}
