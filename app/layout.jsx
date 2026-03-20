export const metadata = {
  title: "FinanceOS — AI-Powered FP&A Platform",
  description: "The financial planning platform that thinks before it answers. AI-native variance detection, scenario modeling, and natural language querying for modern finance teams.",
  keywords: ["FP&A", "financial planning", "AI copilot", "variance detection", "scenario modeling", "SaaS finance", "budget vs actual", "revenue forecasting", "multi-entity consolidation", "month-end close", "finance automation", "cloud FPA", "FP&A software", "financial planning and analysis", "CFO dashboard", "SaaS metrics", "AI financial planning"],
  authors: [{ name: "FinanceOS" }],
  creator: "FinanceOS",
  publisher: "Financial Holding LLC",
  metadataBase: new URL("https://finance-os.app"),
  alternates: { canonical: "https://finance-os.app" },
  openGraph: {
    title: "FinanceOS — AI-Powered FP&A Platform",
    description: "Financial planning that thinks before it answers. Connect your ERP, CRM, and billing data into a unified model with AI-powered insights.",
    url: "https://finance-os.app",
    siteName: "FinanceOS",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FinanceOS — AI-Powered FP&A Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinanceOS — AI-Powered FP&A Platform",
    description: "Financial planning that thinks before it answers.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  category: "technology",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#f8f9fb" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://finance-os.app" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://crecesswagluelvkesul.supabase.co" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://plausible.io" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script defer data-domain="finance-os.app" src="https://plausible.io/js/script.js"></script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "FinanceOS",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "description": "AI-powered financial planning and analysis (FP&A) platform with variance detection, scenario modeling, multi-entity consolidation, and natural language querying.",
          "url": "https://finance-os.app",
          "image": "https://finance-os.app/og-image.png",
          "author": { "@type": "Organization", "name": "Financial Holding LLC" },
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "499",
            "highPrice": "4799",
            "offerCount": "4",
            "offers": [
              { "@type": "Offer", "name": "Starter", "price": "499", "priceCurrency": "USD", "billingIncrement": 1, "unitCode": "MON" },
              { "@type": "Offer", "name": "Growth", "price": "1499", "priceCurrency": "USD", "billingIncrement": 1, "unitCode": "MON" },
              { "@type": "Offer", "name": "Business", "price": "3999", "priceCurrency": "USD", "billingIncrement": 1, "unitCode": "MON" },
              { "@type": "Offer", "name": "Enterprise", "description": "Custom pricing for large organizations" }
            ]
          },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "2400", "bestRating": "5" },
          "featureList": "AI Copilot, Variance Detection, Scenario Modeling, Multi-Entity Consolidation, Month-End Close, Revenue Forecasting, P&L Analysis, 30+ Integrations"
        }) }} />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility", fontFeatureSettings: '"cv01", "ss01"' }}>
        {children}
      </body>
    </html>
  );
}
