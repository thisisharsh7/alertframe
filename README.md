# 🔔 AlertFrame

> Never miss a change on any website. Point, click, get notified.

![AlertFrame Banner](https://via.placeholder.com/800x200/000000/FFFFFF?text=AlertFrame+-+Website+Change+Monitoring)

## 📖 Table of Contents

- [What is AlertFrame?](#what-is-alertframe)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

---

## 🎯 What is AlertFrame?

AlertFrame is a **visual website monitoring tool** that lets you track changes on any website without writing a single line of code. Simply point to what you want to monitor, and get instant notifications when it changes.

### Perfect For:

✅ **E-commerce** - Track competitor prices, product availability
✅ **Job Hunting** - Monitor new job postings on career pages
✅ **News** - Get alerted when specific articles or headlines change
✅ **Real Estate** - Track property listings and price changes
✅ **Finance** - Monitor stock prices, crypto values
✅ **Social Media** - Watch follower counts, engagement metrics
✅ **Business** - Track competitor announcements, product launches

---

## ✨ Key Features

### 🎨 Visual Element Selection
- Click any element on any website to monitor it
- No CSS selectors or HTML knowledge required
- Visual highlighting shows exactly what you're tracking

### 🧠 Smart Change Detection
- Automatically detects content changes
- Compares text, HTML, and even list item counts
- Intelligent diff algorithm shows exactly what changed

### 📧 Multi-Channel Notifications
- **Email** - Professional notifications via Resend
- **Slack** - Direct messages to your workspace (coming soon)
- **Discord** - Webhook notifications (coming soon)

### ⚡ Flexible Scheduling
- Check every 1 minute (for testing)
- Every 2, 5, 10 minutes
- Hourly, daily, or weekly
- Custom intervals

### 📊 Dashboard Management
- View all your alerts in one place
- See change history and statistics
- Pause/resume alerts
- Edit check frequency on the fly

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. Enter URL → 2. Click Element → 3. Configure Alert  │
└─────────────────────────────────────────────────────────┘
                            ↓
           ┌────────────────────────────────┐
           │  AlertFrame checks regularly   │
           │  and compares with last version│
           └────────────────────────────────┘
                            ↓
           ┌────────────────────────────────┐
           │  When changes are detected:    │
           │  • Save snapshot to database   │
           │  • Generate diff report        │
           │  • Send email notification     │
           └────────────────────────────────┘
```

### Step-by-Step:

1. **Enter URL** - Paste any website URL
2. **Visual Selection** - Click on the element you want to monitor
3. **Configure Alert** - Set name, check frequency, and email
4. **Get Notified** - Receive professional emails when changes occur

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** database (or [Supabase](https://supabase.com/) account)
- **Email API Key** from [Resend](https://resend.com/) (free tier available)
- **Git** for version control

### Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd alert-system

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Setup below)

# 4. Set up database
npx prisma db push

# 5. Generate Prisma client
npx prisma generate

# 6. Start the development server
npm run dev

# 7. In a NEW terminal, start the worker
npm run worker
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Setup

### Required Variables

Create a `.env` file in the project root with these **required** variables:

```bash
# Database (Supabase or local PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Email notifications (Get free key from resend.com)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="onboarding@resend.dev"  # Use Resend's test domain

# App configuration
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Optional Variables

```bash
# Authentication (if you want user login)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Redis (for background jobs - optional)
REDIS_URL="redis://localhost:6379"

# Chrome (for visual element selection - optional)
CHROME_MCP_ENABLED="true"
CHROME_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Getting API Keys

#### 1. **Database (Supabase)** - FREE
- Go to [supabase.com](https://supabase.com)
- Create new project
- Go to Settings → Database → Connection String
- Copy "Session Pooler" connection string
- Paste as `DATABASE_URL`

#### 2. **Email (Resend)** - FREE (100 emails/day)
- Go to [resend.com](https://resend.com)
- Sign up for free account
- Create API key
- Copy key and paste as `RESEND_API_KEY`
- Use `EMAIL_FROM="onboarding@resend.dev"` for testing

---

## 💻 Running Locally

### Start Both Servers (Required!)

AlertFrame requires **TWO processes** running simultaneously:

#### Terminal 1: Development Server
```bash
npm run dev
```

This starts:
- Next.js website on `http://localhost:3000`
- API routes for creating/managing alerts
- Database connections

#### Terminal 2: Worker Process
```bash
npm run worker
```

This starts:
- Background worker that checks alerts every minute
- Detects changes and sends notifications
- Logs all activity to console

**⚠️ IMPORTANT:** Both must be running for alerts to work!

### Verify It's Working

1. **Dev Server Running:**
   ```
   ✓ Ready in 2.3s
   Local: http://localhost:3000
   ```

2. **Worker Running:**
   ```
   🚀 Alert Worker Starting...
   ✅ Worker scheduled and ready
   ⏰ Running alert check...
   ```

3. **Test Alert Creation:**
   - Open http://localhost:3000
   - Enter URL: `https://news.ycombinator.com`
   - Click on first story title
   - Set frequency to "Every 2 minutes"
   - Enter your email
   - Click "Create Alert"
   - Check your email for confirmation

---

## 📁 Project Structure

```
alert-system/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── alerts/           # Alert CRUD operations
│   │   │   │   ├── route.ts      # GET, POST alerts
│   │   │   │   └── [id]/         # UPDATE, DELETE alert
│   │   │   └── cron/             # Background jobs
│   │   │       └── check-alerts/ # Alert checking endpoint
│   │   ├── configure/            # Alert configuration page
│   │   ├── dashboard/            # Dashboard view
│   │   ├── selector/             # Visual element selector
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Global styles
│   ├── lib/                      # Utility libraries
│   │   ├── db.ts                 # Prisma database client
│   │   ├── scraper.ts            # Puppeteer web scraping
│   │   ├── differ.ts             # Change detection algorithm
│   │   └── email.ts              # Email notification templates
│   └── workers/                  # Background workers
│       └── check-alerts.ts       # Alert checking worker (node-cron)
├── prisma/
│   └── schema.prisma             # Database schema
├── public/                       # Static assets
├── .env                          # Environment variables (not in git)
├── .env.example                  # Example env file
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - RESTful API
- **Puppeteer** - Headless browser for scraping
- **Cheerio** - HTML parsing and manipulation
- **node-cron** - Task scheduling

### Database & ORM
- **PostgreSQL** - Relational database
- **Prisma** - Type-safe ORM
- **Supabase** - Hosted PostgreSQL (optional)

### Notifications
- **Resend** - Transactional email service
- Professional HTML email templates

### Authentication (Optional)
- **NextAuth.js** - Authentication library
- Google OAuth support

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ "Alerts not being sent"

**Symptom:** Created alert but no emails received

**Solutions:**
1. **Check worker is running:**
   ```bash
   # You should see this in Terminal 2:
   ⏰ [timestamp] Running alert check...
   ```

2. **Verify Resend API key:**
   ```bash
   # Check .env file has:
   RESEND_API_KEY="re_xxxxx"
   EMAIL_FROM="onboarding@resend.dev"
   ```

3. **Check spam folder** - Resend test domain may go to spam

4. **Wait for next check** - Worker runs every minute

5. **Check terminal logs:**
   ```
   ✅ Email notification sent successfully
   # or
   ❌ Failed to send email: [error details]
   ```

---

#### ❌ "Invalid frequency" showing in dashboard

**Symptom:** Dashboard shows "INVALID FREQUENCY" instead of "Every 2 minutes"

**Solution:**
```bash
# Run database migration:
npx prisma db push

# Restart servers:
npm run dev    # Terminal 1
npm run worker # Terminal 2
```

---

#### ❌ "Worker cannot connect to API"

**Symptom:** Worker shows connection errors

**Solution:**
1. Make sure dev server is running in Terminal 1
2. Check port 3000 is not in use by another app
3. Verify `APP_URL="http://localhost:3000"` in `.env`

---

#### ❌ "Database connection failed"

**Symptom:** Errors mentioning Prisma or database

**Solutions:**
```bash
# 1. Check DATABASE_URL in .env is correct

# 2. Test connection:
npx prisma db pull

# 3. Regenerate Prisma client:
npx prisma generate

# 4. Push schema to database:
npx prisma db push
```

---

#### ❌ "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000:
lsof -ti:3000 | xargs kill -9

# Or use different port:
npm run dev -- -p 3001
# Update APP_URL in .env to http://localhost:3001
```

---

### Testing Tips

#### Manual Alert Check
Trigger alert check manually:
```bash
# Visit in browser or use curl:
curl http://localhost:3000/api/cron/check-alerts

# Response shows:
{
  "success": true,
  "summary": {
    "alertsChecked": 1,
    "changesDetected": 0,
    "errors": 0
  }
}
```

#### View Database
```bash
# Open Prisma Studio (GUI for database):
npx prisma studio

# Opens browser at http://localhost:5555
# View/edit alerts, changes, snapshots
```

#### Test with Frequent Changes
Use websites that change often for testing:
- `https://news.ycombinator.com` - Top story changes frequently
- `https://www.reddit.com` - Front page updates constantly
- `https://time.is` - Shows current time (changes every second)

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

AlertFrame is optimized for Vercel:

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Add environment variables in Vercel dashboard:
# - DATABASE_URL
# - RESEND_API_KEY
# - EMAIL_FROM
# - APP_URL (your production URL)
```

### Vercel Configuration

The project includes `vercel.json` for automatic cron jobs:

```json
{
  "crons": [{
    "path": "/api/cron/check-alerts",
    "schedule": "*/10 * * * *"  // Every 10 minutes
  }]
}
```

**Note:** In production, Vercel Cron automatically checks alerts every 10 minutes. No need to run the worker manually!

---

## 📚 Additional Documentation

- [HOW_TO_RUN.md](./HOW_TO_RUN.md) - Detailed step-by-step guide
- [EMAIL_EXPLAINED.md](./EMAIL_EXPLAINED.md) - How email system works
- [MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md) - Database migration guide
- [BUILD_SUMMARY.md](./BUILD_SUMMARY.md) - Development timeline

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- **Email:** support@alertframe.com
- **Twitter:** [@alertframe](https://twitter.com/alertframe)

---

## 🎉 Quick Start Checklist

Before creating your first alert:

- [ ] Node.js 18+ installed
- [ ] Project cloned and `npm install` complete
- [ ] `.env` file created with DATABASE_URL
- [ ] Resend API key added to `.env`
- [ ] `npx prisma db push` completed
- [ ] Terminal 1 running: `npm run dev`
- [ ] Terminal 2 running: `npm run worker`
- [ ] Browser open at `http://localhost:3000`
- [ ] Worker showing logs every minute

**All checked?** You're ready to create your first alert! 🚀

---

**Built with ❤️ using Next.js, Prisma, and Puppeteer**
