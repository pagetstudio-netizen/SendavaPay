# SendavaPay Design Guidelines

## Design Approach

**System-Based with Regional Context**
- Primary inspiration: **Stripe's clarity** + **Revolut's modern fintech UX** + **Wave's African market relevance**
- Foundation: Material Design principles adapted for financial services
- Key principle: **Trust through clarity** - every element communicates security and professionalism
- Target: West African users (Togo, Benin, Burkina Faso, etc.) expecting modern, reliable financial services

## Typography

**Font Families**
- Primary: Inter (Google Fonts) - clean, professional, excellent readability for financial data
- Headings: Inter SemiBold (600) and Bold (700)
- Body: Inter Regular (400) and Medium (500)
- Monospace (for transaction IDs, API keys): JetBrains Mono Regular

**Scale & Hierarchy**
- Hero Headlines: text-5xl md:text-6xl, font-bold
- Section Headers: text-3xl md:text-4xl, font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base (16px), line-height relaxed
- Small Text (timestamps, metadata): text-sm
- Financial Amounts: text-2xl md:text-3xl font-bold with monospace for precision

## Layout System

**Spacing Primitives**
- Core units: **4, 8, 12, 16, 24** (p-4, gap-8, mb-12, py-16, space-y-24)
- Section padding: py-16 md:py-24 for marketing pages
- Card padding: p-6 md:p-8 for dashboards
- Form spacing: space-y-6 for form groups
- Component gaps: gap-4 for icon+text, gap-6 for card grids

**Container Strategy**
- Marketing pages: max-w-7xl mx-auto px-4
- Dashboard content: max-w-6xl mx-auto px-4
- Forms: max-w-md mx-auto for focused tasks
- Admin panels: Full-width with sidebar layout (sidebar: w-64, main: flex-1)

## Component Library

**Navigation**
- Marketing Header: Sticky top navigation with logo (left), menu items (center), CTA buttons (right)
- Dashboard Sidebar: Fixed left sidebar (w-64) with logo, navigation items, user profile at bottom
- Mobile: Hamburger menu with slide-out drawer

**Cards & Containers**
- Transaction Cards: White background, rounded-lg, shadow-sm, border border-gray-200, p-6
- Stat Cards: Grid layout with icon, label, value, and trend indicator
- KYC Document Upload: Dashed border (border-dashed) with upload icon for empty state

**Forms**
- Input Fields: Consistent height (h-12), rounded-md, border-gray-300, focus:ring-2 focus:ring-blue-500
- Labels: Block, text-sm font-medium, mb-2
- Helper Text: text-xs text-gray-500, mt-1
- Error States: Red border + red text-sm message below input
- Phone Number Input: Country code selector + number field (split layout)

**Buttons**
- Primary CTA: Solid background, white text, rounded-md, px-6 py-3, font-medium
- Secondary: Outline style with border, transparent background
- Danger (for admin actions): Red variant
- Icon Buttons: Square (h-10 w-10), rounded-md, for actions in tables

**Data Display**
- Tables: Striped rows, sticky headers, responsive with horizontal scroll on mobile
- Status Badges: Rounded-full, px-3 py-1, text-xs font-medium (Success: green, Pending: yellow, Failed: red, Verified: blue)
- Transaction History: List view with icon, description, amount, date in card format for mobile

**Financial Components**
- Balance Display: Large, prominent with XOF currency symbol, subtle background card
- Amount Input: Prefix "XOF" label, large text, clear formatting (thousands separator)
- Commission Indicator: Small info badge showing "Frais: 7%" near amounts

**Admin Dashboard**
- Metrics Grid: 4 columns on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Charts: Use recharts library with clean, minimal styling
- Action Buttons: Always confirm destructive actions with modal

## Page-Specific Layouts

**Landing Page**
- Hero Section: 70vh, split layout with content (left) + hero image (right) on desktop, stacked on mobile
- How It Works: 3-column grid (icons + titles + descriptions)
- Features: Alternating image-text sections (bento box style)
- Trust Indicators: Logos of supported mobile money providers (TMoney, Moov, Orange)
- CTA Section: Centered with gradient background, prominent signup button

**Dashboard**
- Top: Balance card (prominent, full-width)
- Quick Actions: 4-button grid (Deposit, Transfer, Withdraw, Create Link)
- Recent Transactions: Table/list view with pagination
- Sidebar navigation: Persistent on desktop, collapsible on mobile

**KYC Verification Page**
- Step-by-step form with progress indicator
- Document upload zones: Large, clear dropzones with preview
- Visual confirmation of uploaded files with thumbnail previews

**Admin Panel**
- Sidebar Sections: Dashboard, Users, Transactions, KYC, API, Settings (each with icon)
- Main Content: Breadcrumb navigation + page title + action buttons (top), content area (below)
- Filters: Always at top of data tables (search, date range, status)

## Images

**Provided Assets Usage**
- **Logo (20251211_105226_1765450558306.png)**: Header navigation (h-8 to h-10), login/signup pages, email footers
- **Hero Images**: Use the provided lifestyle images in landing page hero section and feature sections
- **Platform Screenshots**: Place in "How It Works" section showing dashboard, mobile app, transaction flow
- **Trust Building**: Use authentic African imagery to create cultural relevance

**Image Placement Strategy**
- Hero: Large background image (IMG-20251211-WA0021) with overlay, 60% width on desktop
- Features: Side-by-side with text (50/50 split), alternate left/right
- Testimonials: Circular avatars if using user testimonials
- KYC Section: Illustrative graphics showing document types accepted

## Accessibility & UX Patterns

- All interactive elements: min-height 44px (touch-friendly)
- Loading states: Skeleton screens for data-heavy pages, spinner for actions
- Empty states: Friendly illustrations with clear CTAs
- Error messages: Inline, specific, actionable
- Success confirmations: Toast notifications (top-right), auto-dismiss after 5s
- Form validation: Real-time for critical fields (phone, email), on-submit for others

## Animations

**Minimal, Purposeful Only**
- Page transitions: Fade-in (duration-200)
- Hover states: Subtle scale (scale-105) on cards
- Loading: Pulse animation on skeletons
- Success actions: Checkmark animation on completion
- No parallax, no scroll-triggered animations (focus on performance)

## Responsive Breakpoints

- Mobile-first approach
- sm: 640px (phones landscape)
- md: 768px (tablets)
- lg: 1024px (desktop)
- xl: 1280px (large desktop)
- Dashboard switches to mobile menu < 768px
- Tables scroll horizontally < 640px