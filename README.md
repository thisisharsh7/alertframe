# AlertFrame

AlertFrame is a visual website monitoring tool that lets you click on any element on any website and receive instant email notifications when it changes. Perfect for tracking competitor prices, job postings, news articles, and more.

## Installation

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database (Supabase recommended)
- Google OAuth credentials
- Gmail API enabled

### Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd alert-system

# Install dependencies
npm install
```

### Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# NextAuth (REQUIRED)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Encryption (REQUIRED)
ENCRYPTION_KEY="generate-with-openssl-rand-base64-32"

# App Config (REQUIRED)
NODE_ENV="development"
APP_URL="http://localhost:3000"

# Email Fallback (OPTIONAL)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="onboarding@resend.dev"
```

Generate secrets:
```bash
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
```

Set up Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Enable Gmail API
5. Copy Client ID and Secret to `.env`

### Database Setup

```bash
# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## Running Locally

AlertFrame requires two processes running simultaneously:

### Terminal 1: Development Server

```bash
npm run dev
```

This starts the Next.js application on `http://localhost:3000`

### Terminal 2: Worker Process

```bash
npm run worker
```

This starts the background worker that checks alerts every minute.

Both processes must be running for alerts to work.

## Verify It's Working

1. Open browser: http://localhost:3000
2. Sign in with your Google account
3. Create a test alert:
   - Enter URL: `https://news.ycombinator.com`
   - Click on the first story title
   - Set check frequency to "Every 2 minutes"
   - Click "Create Alert"
4. Check terminal logs - Worker should show "Running alert check..."
5. Check your Gmail - You'll receive notifications when changes are detected

## Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run worker       # Start background worker (checks alerts)
npm run db:push      # Push database schema
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:generate  # Generate Prisma client
```

## Tech Stack

- Next.js 15
- TypeScript
- Prisma + PostgreSQL
- Puppeteer
- NextAuth.js + Gmail API
- Tailwind CSS

## Troubleshooting

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
```

### Database connection issues
```bash
npx prisma db push
npx prisma generate
```

### Worker not sending emails
- Check both terminals are running
- Verify `DATABASE_URL` is correct
- Ensure Gmail OAuth is set up properly
- Check terminal logs for error messages

### View database contents
```bash
npx prisma studio  # Opens at http://localhost:5555
```
