# Ignitabull Marketing Website

The marketing website for Ignitabull, built with Next.js 15 and featuring privacy-first analytics, lead capture, and conversion optimization.

## Features

- 🎯 **High-Converting Landing Pages** - Optimized for conversion with A/B testing capabilities
- 📊 **Privacy-First Analytics** - Plausible Analytics for GDPR-compliant tracking
- 🔍 **Advanced User Behavior** - PostHog integration for heatmaps and session recording
- 📝 **Lead Capture Forms** - Multi-step forms with conditional logic
- 🚀 **SEO Optimized** - Built-in technical SEO and performance optimization
- 🍪 **GDPR Compliant** - Comprehensive consent management system

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: TailwindCSS 4 with custom design system
- **Analytics**: Plausible + PostHog
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: Supabase (for lead capture)

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. Start the development server:
```bash
bun dev
# or from monorepo root:
bun run dev:marketing
```

4. Open [http://localhost:3002](http://localhost:3002) in your browser.

## Environment Variables

### Required
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - Your Plausible Analytics domain
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project key for advanced analytics
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics 4 measurement ID
- `NEXT_PUBLIC_SITE_URL` - Production site URL
- `NEXT_PUBLIC_APP_URL` - Dashboard app URL

## Privacy & Compliance

This marketing site is built with privacy-first principles:

- **Cookie-free tracking** with Plausible Analytics
- **Consent management** for advanced tracking features
- **GDPR compliance** built-in with user rights support
- **Data minimization** - only collect necessary data

## Analytics & Tracking

### Plausible Analytics
- Always enabled (privacy-first)
- No cookies required
- GDPR compliant by design

### PostHog
- Enabled only with user consent
- Heatmaps and session recording
- Advanced behavioral analytics

### Custom Events
The site tracks various conversion events:
- Form submissions
- CTA clicks
- Video plays
- Scroll depth
- Time on page

## Lead Capture

Forms automatically capture leads to Supabase with:
- Visitor identification
- Source tracking (UTM parameters)
- Behavior scoring
- Automated follow-up triggers

## Deployment

The marketing site can be deployed to:
- **Vercel** (recommended)
- **Netlify** 
- **Any Edge hosting**

### Vercel Deployment
1. Connect your repository to Vercel
2. Set the root directory to `apps/marketing`
3. Configure environment variables
4. Deploy

## Performance

The site is optimized for:
- **Core Web Vitals** - Excellent scores across all metrics
- **SEO** - Structured data and meta optimization
- **Accessibility** - WCAG 2.1 AA compliance
- **Mobile** - Mobile-first responsive design

## Development

### Project Structure
```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable UI components
├── sections/         # Page sections (Hero, Features, etc.)
├── lib/             # Utility functions and configurations
└── utils/           # Helper utilities
```

### Adding New Pages
1. Create a new directory in `src/app/`
2. Add `page.tsx` and optional `layout.tsx`
3. Update navigation in components as needed

### Analytics Events
Use the analytics utilities:
```typescript
import { trackEvent, trackLead } from '@/components/analytics'

// Track custom event
trackEvent('Button Clicked', { button: 'hero-cta' })

// Track lead capture
trackLead({
  email: 'user@example.com',
  source: 'landing-page',
  campaign: 'summer-2025'
})
```

## Contributing

1. Follow the existing code style
2. Add analytics tracking to new CTAs
3. Ensure GDPR compliance for new features
4. Test on mobile devices
5. Optimize for Core Web Vitals