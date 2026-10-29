# 🌐 Nexa Smart Banking

**A full-stack, enterprise-grade digital banking experience engineered for secure, intelligent everyday money management and seamless financial workflows.**

## 📑 Table of Contents

1. [About The Project](#-about-the-project)
2. [Key Architecture & Highlights](#-key-architecture--highlights)
3. [Product Scope & Modules](#-product-scope--modules)
4. [Technology Stack & Ecosystem](#-technology-stack--ecosystem)
5. [System Architecture & Directory Structure](#-system-architecture--directory-structure)
6. [Database Schema & Security Principles](#-database-schema--security-principles)
7. [Getting Started Locally](#-getting-started-locally)
8. [Environment Variables Setup](#️-environment-variables-setup-env)
9. [Available Scripts](#-available-scripts)
10. [License & Acknowledgments](#-license--acknowledgments)
11. [Future Scopes & Enhancements]



## 💡 About The Project

**Nexa Smart Banking** is a production-grade full-stack digital banking platform designed to eliminate fragmented banking apps. It provides a unified, highly secure, and visually responsive user console. By combining real-time transaction tracking, strict database-level security protocols, multi-channel fund transfers, and an integrated **AI Money Coach**, Nexa bridges the gap between consumer-facing fintech interfaces and rigorous backend banking standards.

## ⚡ Key Architecture & Highlights

- 🔒 **Secure Money Movement:** Built on server-verified transactions, atomic database routines, and strict Row Level Security (RLS) to help prevent balances or daily limits from being spoofed or bypassed client-side.
- 🤖 **AI Money Coach:** Leverages transactional analytics to compute category-level spending health scores (0–100), track expense footprints, and return personalized saving recommendations.
- 🎨 **5-Theme Dynamic Switcher:** Includes an advanced theme engine supporting five unique design palettes (*Midnight Vault*, *Nexa Crimson*, *Emerald Growth*, *Royal Indigo*, and *Sunset Amber*) constructed with OKLCH design tokens.
- 📱 **Unified Connected Experience:** Nine banking modules operating within a single authenticated layout shell (`AppShell`).

## 🚀 Product Scope & Modules

1. **Dashboard:** Real-time balances, income/expense summaries, cash-flow charts, and quick-action shortcuts.
2. **Transfer Money:** Routing support for **UPI**, **IMPS**, **NEFT**, and **RTGS** transfers with validation guards.
3. **Transactions:** Advanced filtering, category search, pagination, and one-click CSV statement exports.
4. **Cards Management:** Virtual and physical card management featuring freeze/unfreeze toggles, spending limit updates, and security controls.
5. **Bills & Recharge:** Utility bill settlements, subscription tracking, and automated autopay scheduling.
6. **Deposits:** Fixed Deposit (FD) and Recurring Deposit (RD) creation modules with maturity interest projections.
7. **Beneficiaries:** Payee management system supporting account additions and deletions.
8. **AI Insights & Coach:** Financial analysis and smart budgeting insights.
9. **Profile & Security:** KYC verification tracking, security notification thresholds, and password/authentication management.

## 🛠️ Technology Stack & Ecosystem

| **Layer** | **Technology & Frameworks** |
|---|---|
| **Frontend** | React 19, TypeScript, TanStack Router, TanStack Query, Recharts, React Hook Form, Zod |
| **Backend & Server** | TanStack Start server functions, PostgreSQL, SQL RPC stored procedures, Supabase Auth, Google OAuth |
| **UI & Styling** | Tailwind CSS v4, shadcn/ui primitives, Radix UI, Lucide Icons, Vite 8 |
| **Tooling & Validation** | TypeScript strict mode, Zod runtime checks, Bun / npm package managers |

## 📂 System Architecture & Directory Structure

```text
nexa-smart-banking/
├── src/
│   ├── routes/              # Page-level route components
│   ├── components/
│   │   ├── app/             # AppShell, navigation, theme switcher, header
│   │   └── ui/              # Reusable UI components and widgets
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Business logic, utilities, AI gateway functions
│   ├── integrations/        # Supabase client configuration and database types
│   ├── router.tsx           # TanStack Router configuration
│   ├── routeTree.gen.ts     # Generated route tree definitions
│   └── styles.css           # Global CSS design tokens and OKLCH variables
├── public/                  # Static assets and favicons
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript compiler configuration
```

## 🔐 Database Schema & Security Principles

- **PostgreSQL RLS (Row Level Security):** Restricts access to accounts, transactions, and beneficiaries according to configured user-level policies.
- **Atomic Transactions:** Fund transfers use transactional RPC routines. If a debit succeeds but a credit fails, the entire transaction rolls back to help protect ledger consistency.


## 🔮 Future Scopes & Enhancements

- [ ] **UPI & QR Code Payments:** Enable instant peer-to-peer payments through QR code scanning and generation for seamless money transfers.
- [ ] **Loan & EMI Module:** Introduce loan calculators, preliminary loan eligibility checks, repayment schedules, and automated EMI tracking.
- [ ] **Admin & Bank-Staff Console:** Develop a comprehensive back-office dashboard to manage user verification, flag suspicious transactions, and review KYC submissions.
- [ ] **Biometric & 2FA Authentication:** Strengthen account security with WebAuthn, supported biometric authentication, and hardware security key-based multi-factor authentication.
- [ ] **Multi-Currency Wallets:** Support multiple currencies with foreign exchange rate integration, cross-border remittances, and multi-currency account management.
## 🚀 Getting Started Locally

### Prerequisites

Make sure the following software is installed on your development machine:

- **Node.js** (v18.x or higher, subject to project compatibility)
- **npm** or **Bun** package manager

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/KomalYadav1801/Nexa-Smart-Banking.git
   ```

2. **Navigate into the project directory:**

   ```bash
   cd Nexa-Smart-Banking
   ```

3. **Install project dependencies:**

   ```bash
   npm install
   ```

4. **Configure your environment variables:** Create a `.env` file in the root directory and add your backend/database configuration keys (see below).

5. **Start the development server:**

   ```bash
   npm run dev
   ```

## ⚙️ Environment Variables Setup (`.env`)

Create a `.env` file in the root directory with the following keys:

```dotenv
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev` — Starts the development server with hot reloading.
- `npm run build` — Builds the application for production.
- `npm run start` — Runs the production server locally.

## 📝 License & Acknowledgments

Distributed under the MIT License. See `LICENSE` or repository settings for more information.

*Crafted with precision by [Komal Yadav](https://github.com/KomalYadav1801).*
