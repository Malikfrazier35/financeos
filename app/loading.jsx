export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#07080a",
      gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        borderRadius: 12,
        background: "linear-gradient(135deg, #60a5fa, #818cf8, #a78bfa)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 14px rgba(96,165,250,0.25)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="2" width="3.5" height="20" rx="1.5" fill="white" opacity="0.95" />
          <rect x="3" y="2" width="16" height="3.2" rx="1.5" fill="white" opacity="0.95" />
          <rect x="3" y="9.5" width="11" height="2.8" rx="1.2" fill="white" opacity="0.65" />
          <rect x="14" y="14" width="2.8" height="8" rx="1" fill="white" opacity="0.4" />
          <rect x="18" y="10" width="2.8" height="12" rx="1" fill="white" opacity="0.55" />
        </svg>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#3d4558", letterSpacing: "0.04em" }}>LOADING</div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }`}</style>
    </div>
  );
}
