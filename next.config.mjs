/** @type {import('next').NextConfig} */

// The v3 HTML files live in public/site/
const V3 = "/site";

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)' ,
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.plaid.com https://plausible.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.plaid.com https://plausible.io https://api.anthropic.com https://oauth.platform.intuit.com https://*.api.intuit.com https://sandbox-quickbooks.api.intuit.com https://quickbooks.api.intuit.com wss://*.supabase.co",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://cdn.plaid.com",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/opengraph-image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
      {
        source: '/icon.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        // Main marketing pages
        { source: "/", destination: `${V3}/landing.html` },
        { source: "/pricing", destination: `${V3}/pricing.html` },
        { source: "/about", destination: `${V3}/about.html` },
        { source: "/contact", destination: `${V3}/contact.html` },
        { source: "/solutions", destination: `${V3}/solutions.html` },
        { source: "/integrations", destination: `${V3}/integrations.html` },
        { source: "/security", destination: `${V3}/security.html` },
        { source: "/resources", destination: `${V3}/resources.html` },
        { source: "/whats-new", destination: `${V3}/whats-new.html` },
        { source: "/competitors", destination: `${V3}/competitors.html` },
        { source: "/xpa-planning", destination: `${V3}/xpa-planning.html` },
        { source: "/pain-points", destination: `${V3}/pain-points.html` },
        { source: "/ad-campaign", destination: `${V3}/ad-campaign.html` },

        // Dashboard showcase pages
        { source: "/dashboard/standard", destination: `${V3}/dashboard/standard.html` },
        { source: "/dashboard/ceo", destination: `${V3}/dashboard/ceo.html` },
        { source: "/dashboard/ceo-light", destination: `${V3}/dashboard/ceo-light.html` },
        { source: "/dashboard/cfo", destination: `${V3}/dashboard/cfo.html` },
        { source: "/dashboard/cfo-light", destination: `${V3}/dashboard/cfo-light.html` },
        { source: "/dashboard/controller", destination: `${V3}/dashboard/controller.html` },
        { source: "/dashboard/controller-light", destination: `${V3}/dashboard/controller-light.html` },
        { source: "/dashboard/fpa", destination: `${V3}/dashboard/fpa.html` },
        { source: "/dashboard/fpa-light", destination: `${V3}/dashboard/fpa-light.html` },
        { source: "/dashboard/command-center", destination: `${V3}/dashboard/command-center.html` },
        { source: "/dashboard/roles", destination: `${V3}/dashboard/roles.html` },
        { source: "/dashboard/roles-upgraded", destination: `${V3}/dashboard/roles-upgraded.html` },
        { source: "/dashboard/tiers", destination: `${V3}/dashboard/tiers.html` },
        { source: "/dashboard/tiers-clean", destination: `${V3}/dashboard/tiers-clean.html` },
        { source: "/dashboard/tiers-spring", destination: `${V3}/dashboard/tiers-spring.html` },
        { source: "/dashboard/customizer", destination: `${V3}/dashboard/customizer.html` },
        { source: "/dashboard/customizer-v2", destination: `${V3}/dashboard/customizer-v2.html` },
        { source: "/dashboard/onboarding", destination: `${V3}/dashboard/onboarding.html` },
        { source: "/dashboard/guided-tour", destination: `${V3}/dashboard/guided-tour.html` },
        { source: "/dashboard/workspace", destination: `${V3}/dashboard/workspace.html` },
        { source: "/dashboard/committed-spend", destination: `${V3}/dashboard/committed-spend.html` },

        // Design studio and templates
        { source: "/design-studio/:path*", destination: `${V3}/design-studio/:path*` },
        { source: "/templates/:path*", destination: `${V3}/templates/:path*` },
        { source: "/v3/:path*", destination: `${V3}/:path*` },
      ],
    };
  },

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    minimumCacheTTL: 2592000,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'companieslogo.com' },
      { protocol: 'https', hostname: 'asset.brandfetch.io' },
      { protocol: 'https', hostname: 'cdn.simpleicons.org' },
    ],
  },
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
};

export default nextConfig;
