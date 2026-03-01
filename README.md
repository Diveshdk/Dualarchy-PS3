# EventEase - Enterprise Event Management Platform

> **Hackathon Submission: Dualarchy PS3**  
> A production-grade SaaS platform for managing events, branches, leads, and analytics with real-time collaboration.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Diveshdk/Dualarchy-PS3)

---

## 🚀 Features

### Core Functionality
- **🎯 Event Management** - Create, schedule, and manage events with intelligent priority handling
- **🏢 Branch Management** - Multi-location support with branch-specific dashboards and analytics
- **👥 Lead Lifecycle Tracking** - Complete CRM with kanban boards and conversion analytics
- **📊 Production Analytics** - Real-time insights with revenue tracking and performance metrics
- **📅 Smart Booking System** - Conflict detection, availability management, and automated scheduling
- **💰 Payment Processing** - Integrated payment tracking with invoice generation
- **📦 Inventory & Supply Management** - Track resources, supplies, and allocations across branches

### Advanced Features
- **🔐 Role-Based Access Control (RBAC)** - Admin, Branch Manager, and Staff roles
- **⚡ Real-time Updates** - Live data synchronization using Supabase Realtime
- **🤖 AI-Powered Analytics** - Google Gemini integration for intelligent insights
- **📱 Responsive Design** - Mobile-first UI with dark/light theme support
- **🔔 Smart Notifications** - Real-time alerts for bookings, leads, and system events
- **📈 Interactive Charts** - Beautiful data visualization with Recharts
- **🎨 Modern UI/UX** - Built with shadcn/ui and Framer Motion animations

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 14 (App Router), React 19, TypeScript |
| **Database** | Supabase (PostgreSQL with Row Level Security) |
| **Authentication** | Supabase Auth with email/password |
| **Styling** | TailwindCSS 4, shadcn/ui, Framer Motion |
| **AI** | Google Generative AI (Gemini) |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod validation |
| **Deployment** | Vercel |

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+ or pnpm
- Supabase account (free tier works)
- Google AI API key (optional, for AI features)

### 1. Clone the Repository
```bash
git clone https://github.com/Diveshdk/Dualarchy-PS3.git
cd Dualarchy-PS3
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: AI Features
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

**Get your Supabase credentials:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 4. Initialize Database

Run the database schema setup:

```bash
# Option 1: Using Supabase Dashboard
# Go to SQL Editor in Supabase Dashboard
# Copy and paste contents from scripts/production-schema.sql
# Execute the SQL

# Option 2: Using Supabase CLI (if installed)
supabase db push
```

### 5. (Optional) Inject Demo Data

To populate with sample data for testing:

```bash
npx tsx scripts/inject-demo-data.ts
```

This creates:
- 3 branches (Mumbai, Delhi, Bangalore)
- 20 leads across different stages
- 15 bookings with various statuses
- 10 events with realistic data
- Sample inventory items
- Demo users with different roles

### 6. Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Sign Up and Explore

1. Go to `/auth/sign-up` to create an account
2. Sign in at `/auth/login`
3. Explore the dashboard with demo data

---

## 📂 Project Structure

```
eventease/
├── app/                          # Next.js App Router
│   ├── auth/                    # Authentication pages
│   ├── dashboard/               # Main application
│   │   ├── analytics-production/    # Production analytics
│   │   ├── branch-manager-portal/   # Branch management
│   │   ├── leads-lifecycle/         # Lead CRM
│   │   ├── bookings/               # Booking management
│   │   ├── events/                 # Event management
│   │   └── ...
│   └── layout.tsx               # Root layout
├── components/                  # Reusable components
│   ├── dashboard/              # Dashboard components
│   ├── ui/                     # shadcn/ui components
│   └── ...
├── lib/                        # Utilities and actions
│   ├── supabase/              # Supabase clients
│   ├── actions.ts             # Server actions
│   └── types.ts               # TypeScript types
├── scripts/                    # Database scripts
│   ├── production-schema.sql  # Database schema
│   └── inject-demo-data.ts    # Demo data generator
└── public/                     # Static assets
```

---

## 🎯 Key Features Deep Dive

### 1. Branch Manager Portal (`/dashboard/branch-manager-portal`)
- Real-time branch performance tracking
- Staff management with role assignment
- Branch-specific KPIs and metrics
- Payment processing with Stripe integration
- Booking approval workflows

### 2. Lead Lifecycle Management (`/dashboard/leads-lifecycle`)
- Visual kanban board (New → Contacted → Qualified → Won/Lost)
- Lead scoring and prioritization
- Conversion analytics with funnel visualization
- Activity timeline and notes
- Automated follow-up reminders

### 3. Production Analytics (`/dashboard/analytics-production`)
- Revenue trends and forecasting
- Branch performance comparison
- Event success metrics
- Booking conversion rates
- Interactive charts and graphs

### 4. Real-Time Collaboration
- Live updates across all dashboards
- Presence indicators
- Instant notifications
- Conflict resolution

---

## 🔐 Authentication & Security

- **Supabase Auth** - Secure email/password authentication
- **Row Level Security (RLS)** - Database-level security policies
- **Role-Based Access Control** - Fine-grained permissions
- **Protected Routes** - Middleware-based route protection
- **Secure API Routes** - Server-side validation

---

## 🎨 UI/UX Highlights

- **Modern Design System** - Consistent, beautiful UI with shadcn/ui
- **Dark/Light Mode** - Seamless theme switching
- **Responsive Layout** - Works on all devices
- **Smooth Animations** - Framer Motion transitions
- **Accessible Components** - ARIA compliant
- **Loading States** - Skeleton screens and spinners

---

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with:
- **Users & Profiles** - User management with roles
- **Branches** - Multi-location support
- **Events** - Event catalog with pricing
- **Bookings** - Booking management with status tracking
- **Leads** - CRM with lifecycle stages
- **Inventory** - Resource management
- **Payments** - Financial tracking
- **Notifications** - Alert system

All tables include:
- Row Level Security (RLS) policies
- Automatic timestamps
- Soft deletes
- Foreign key relationships

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub:
```bash
git push origin main
```

2. Import to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. Add Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_GENAI_API_KEY` (optional)

---

## 📝 API Routes & Server Actions

The application uses Next.js Server Actions for data mutations:

- **Bookings**: Create, update, approve/reject bookings
- **Leads**: Add, update, move through lifecycle stages
- **Events**: Create and manage events
- **Branches**: Add, update branch information
- **Payments**: Process and track payments

All actions include:
- TypeScript type safety
- Zod validation
- Error handling
- Loading states

---

## 🧪 Testing the Application

### Test Accounts (after running demo data script)

```
Admin Account:
Email: admin@eventease.com
Password: admin123

Branch Manager:
Email: manager@eventease.com
Password: manager123

Staff:
Email: staff@eventease.com
Password: staff123
```

### Test Scenarios

1. **Create a Booking**: Dashboard → Bookings → New Booking
2. **Manage Leads**: Dashboard → Leads Lifecycle → Drag cards
3. **View Analytics**: Dashboard → Production Analytics
4. **Branch Management**: Dashboard → Branch Manager Portal
5. **Process Payment**: Branch Portal → Pending Payments

---

## 🤝 Contributing

This is a hackathon submission project. Feel free to fork and customize for your needs!

---

## 📄 License

MIT License - feel free to use this project for learning or hackathons.

---

## 🏆 Hackathon Notes

**Built for**: Dualarchy PS3 Hackathon  
**Development Time**: Sprint development with production-grade standards  
**Key Achievements**:
- ✅ Full-stack application with 12+ features
- ✅ Real-time collaboration
- ✅ AI-powered analytics
- ✅ Production-ready deployment
- ✅ Comprehensive documentation
- ✅ 2600+ lines of production code

---

## 📧 Contact

For questions or feedback:
- GitHub: [@Diveshdk](https://github.com/Diveshdk)
- Repository: [Dualarchy-PS3](https://github.com/Diveshdk/Dualarchy-PS3)

---

**Made with ❤️ for EventEase Hackathon 2026**
