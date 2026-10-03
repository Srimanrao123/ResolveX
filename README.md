# ResolveX — Autonomous AI Return & Dispute Resolution

> **ResolveX** is an autonomous AI return and customer operations platform for modern e-commerce brands. It functions as a 24/7 intelligent return department—evaluating return requests against actual delivered orders, merchant policies, visual evidence, and customer history to deliver instant resolutions for routine claims and actionable recommendations for complex exceptions.

---

## 🌟 Key Highlights

- **⚡ Instant Automated Approvals**: Routinely approves valid customer returns in under 30 seconds using policy verification and risk-scoring algorithms.
- **📸 Visual Evidence Inspection**: Secure upload of photo evidence directly to cloud storage, paired with automated assessment for damage/defect claims.
- **💬 Conversational Return Assistant**: Natural-language conversational interface that structures customer intents, handles custom reasons, and guides users step-by-step.
- **🏷️ Automated Return Logistics**: Provides customers with immediate packing checklists, prepaid shipping label instructions, and 1-click printable return slips.
- **🛡️ Seller Operations Command Center**: Centralized dashboard for merchants to review high-risk exceptions, inspect evidence with signed URLs, update order delivery statuses, and take 1-click decisions.
- **🔄 Live Lifecycle Tracking**: Real-time multi-stage status tracking (`Requested` → `Approved / Reviewed` → `In Transit` → `Refunded`) with timestamped activity audit logs.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Server Components, Server Actions, Route Handlers |
| **Frontend** | [React 19](https://react.dev/) + TypeScript | Modern typed UI components and responsive layout |
| **Styling** | Vanilla CSS Design System | Curated theme, responsive grid/flex layouts, micro-animations |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Relational schema with foreign keys, indexes, and RPCs |
| **Storage** | Supabase Storage (`return-evidence`) | Private bucket for customer return photos with signed URLs |
| **Authentication** | Custom Cookie Sessions | Role-based authentication (Customer vs. Seller / Merchant) |
| **AI Engine** | Anthropic Claude & Rule Engine | Evidence vision analysis, reason classification, risk scoring |
| **Email Delivery** | [Resend](https://resend.com/) | Transactional email notifications and OTP delivery |

---

## 🚀 Product Walkthrough

### 1. Customer Experience
1. **Catalog & Cart**: Customers browse products, add items to their cart (with live cart badge counter), and must sign in before checkout.
2. **My Orders**: Customers view all past purchases with real-time delivery status badges (`ORDERED`, `PROCESSING`, `SHIPPED`, `DELIVERED`).
3. **Initiating a Return**:
   - Returns are restricted to delivered orders within the merchant's 30-day window.
   - Customers launch the conversational return assistant directly from their order.
   - If a return has already been requested, the system automatically resumes the existing case without restarting.
4. **Reason & Photo Evidence**:
   - Choose from structured reasons (`Too Small`, `Too Large`, `Damaged`, `Defective`, `Wrong Item`, `Not as Expected`, `Changed Mind`) or custom `Other`.
   - Damage and defect claims dynamically prompt for a photo upload with immediate feedback.
5. **Instant Resolution & Next Steps**:
   - Routine claims within policy are approved immediately.
   - An approved return page generates a reference ID (`RET-XXXXXXXX`), packaging instructions, and a printable prepaid return slip.
   - High-risk or unusual claims are placed `UNDER REVIEW` with estimated timelines.

### 2. Seller / Merchant Command Center
1. **Queue & Health Metrics**:
   - Real-time count of total cases, approval rate percentage, pending reviews, and high-risk flags.
2. **Case Detail & AI Summary**:
   - Item unit price, customer message, requested resolution (Refund / Exchange / Replacement).
   - AI risk breakdown (`LOW`, `MEDIUM`, `HIGH`) and policy assessment.
   - High-resolution evidence viewer with secure time-limited signed URLs.
3. **Seller Actions**:
   - `Approve Return`: Grants refund/exchange authorization and updates customer timeline.
   - `Reject Return`: Declines ineligible requests with a structured reason.
   - `Request Information`: Prompts customer for additional documentation.
4. **Order Status Management**:
   - Allows sellers to transition customer orders from `ORDERED` → `PROCESSING` → `SHIPPED` → `DELIVERED`, triggering customer return eligibility in real time.

---

## 📁 Repository Structure

```text
ResolveX/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/                # Sign-in, sign-up, OTP verification routes
│   │   │   ├── orders/              # Order creation and checkout API
│   │   │   ├── returns/             # Return evaluation, creation, evidence upload
│   │   │   └── seller/              # Seller decision and order status endpoints
│   │   ├── (auth)/                  # Login & customer authentication pages
│   │   ├── orders/                  # Customer "My Orders" portal
│   │   ├── returns/                 # Return intake & live case status pages
│   │   │   ├── new/                 # Start or resume return flow
│   │   │   └── [id]/                # Real-time case tracking & printable label
│   │   ├── seller/                  # Seller dashboard, queue, case review
│   │   └── globals.css              # Core design tokens and vanilla CSS system
│   ├── components/                  # Reusable UI components
│   │   ├── return-chat.tsx          # Conversational return intake assistant
│   │   ├── return-label-button.tsx  # 1-click print return shipping label & slip
│   │   ├── seller-order-status.tsx  # Real-time seller order status selector
│   │   ├── case-actions.tsx         # Seller 1-click decision actions
│   │   └── resolve-x-logo.tsx       # Brand logo vector component
│   └── lib/                         # Business logic & utilities
│       ├── app-auth.ts              # Session management & user profile lookup
│       ├── customer-returns.ts      # Customer return case retrieval & queries
│       ├── orders.ts                # Order loading & auto-seeding
│       ├── return-engine.ts         # Policy evaluation and risk calculation
│       ├── seller-data.ts           # Seller queue metrics & case normalization
│       └── supabase/                # Supabase client configurations
├── supabase/
│   ├── schema.sql                   # Database tables, triggers, and RPC functions
│   └── migrations/                  # Database migration files
├── docs/                            # Comprehensive design & architecture plans
└── package.json
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v18.18+ or v20+
- **npm** or **pnpm**
- **Supabase Account**: A Supabase project with database & storage access

### 1. Clone & Install

```bash
git clone https://github.com/Srimanrao123/ResolveX.git
cd ResolveX
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication
AUTH_SECRET=your-random-32-character-secret

# Resend Email Delivery (Optional for local OTP testing)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=ResolveX <login@yourdomain.com>

# Anthropic Claude API (Optional for enhanced AI visual evidence review)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

### 3. Database & Storage Setup

1. Open your **Supabase Dashboard → SQL Editor**.
2. Run the SQL script from [`supabase/schema.sql`](supabase/schema.sql).
3. Ensure a storage bucket named `return-evidence` is created with private access.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Demo Accounts

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Customer** | `bonalasriman@gmail.com` | `password123` | Storefront, My Orders, Return Intake |
| **Seller / Admin** | `srimanrao0707@gmail.com` | `password123` | Merchant Dashboard (`/seller`), Case Review, Order Management |

> 📱 **For OTP, contact: `8500125135`**

---

## 🔒 Security & Policy Protection

- **Role-Based Route Guards**: Server-side access enforcement via `requireCustomer()` and `requireSeller()`.
- **Session Integrity**: Encrypted HTTP-only cookies with cryptographic hashing against spoofing.
- **Evidence Isolation**: Uploaded damage photos are stored in private Supabase buckets; access URLs are generated with short-lived cryptographic signatures (60 minutes).
- **Abuse Prevention**: Automated tracking of claim frequency (e.g. 5+ returns or 3+ damage claims in 60 days) automatically flags requests as `HIGH` risk and prevents automated refunds.

---

## 📄 License

This project is licensed under the MIT License.
