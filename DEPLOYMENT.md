# 🚀 AlertFrame Deployment Guide

Complete guide for deploying AlertFrame to production on Vercel.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account (for version control)
- ✅ Vercel account (free tier works)
- ✅ All services already configured:
  - Supabase PostgreSQL database
  - Google OAuth credentials
  - Gmail OAuth working locally
  - Resend API key (optional fallback)

---

## 🏗️ Architecture: Local vs Production

### **Local Development (2 Processes)**

```bash
# Terminal 1: Next.js web server
npm run dev

# Terminal 2: Worker (simulates cron)
npm run worker
```

**Why 2 processes locally?**
- Next.js dev server doesn't run background cron jobs
- Worker simulates production cron behavior by calling API endpoint every minute

### **Production on Vercel (1 Process + External Cron)**

```
Vercel automatically runs:
├── npm run build    (builds optimized production app)
└── npm start        (starts Next.js production server)

External Cron Service:
├── Vercel Cron OR cron-job.org
└── Calls: https://your-app.vercel.app/api/cron/check-alerts
```

**Why no worker in production?**
- Vercel is serverless (no persistent background processes)
- External cron service makes HTTP requests to your API
- Your API route handles alert checking logic

---

## 🔧 Step 1: Prepare Your Code

### 1.1 Verify Changes

All necessary changes are already made:
- ✅ `@sparticuz/chromium` installed (for serverless Chrome)
- ✅ `src/lib/scraper.ts` updated for Vercel compatibility
- ✅ `vercel.json` configured with cron
- ✅ Environment validation in place

### 1.2 Commit Your Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: production-ready deployment with serverless Chrome and OAuth"

# Push to GitHub
git push origin main
```

---

## 🚢 Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

Follow the browser prompts to authenticate.

### 2.3 Deploy Preview

```bash
vercel
```

**Follow the prompts:**
- Set up and deploy? **Y**
- Which scope? (select your account)
- Link to existing project? **N** (unless you already have one)
- What's your project name? **alert-system** (or your preferred name)
- In which directory is your code? **./
- Override settings? **N**

You'll get a preview URL: `https://alert-system-abc123.vercel.app`

### 2.4 Deploy to Production

```bash
vercel --prod
```

Your production URL: `https://alert-system-xyz.vercel.app` or `https://your-custom-domain.com`

---

## 🔐 Step 3: Configure Environment Variables

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

### 3.1 Required Variables

Add these variables for **Production** environment:

#### Database
```bash
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```
💡 Use "Session Pooler" or "Transaction Pooler" connection string from Supabase

#### Authentication
```bash
NEXTAUTH_SECRET=your_32_char_secret_here
NEXTAUTH_URL=https://your-project.vercel.app
```
💡 Generate secret: `openssl rand -base64 32`

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=815157129341-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```
💡 From Google Cloud Console

#### Encryption
```bash
ENCRYPTION_KEY=your_encryption_key_here
```
💡 Generate: `openssl rand -base64 32`

#### App Configuration
```bash
NODE_ENV=production
APP_URL=https://your-project.vercel.app
```

#### Cron Security
```bash
CRON_SECRET=your_secure_cron_secret
```
💡 Generate: `openssl rand -base64 32`

### 3.2 Optional Variables

#### Email Fallback (Resend)
```bash
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=alerts@yourdomain.com
```
💡 Optional - Gmail OAuth is primary method

**IMPORTANT:** Replace all URLs with your actual Vercel deployment URL!

---

## 🔑 Step 4: Update Google OAuth Settings

Your app URL has changed from `localhost:3000` to your Vercel domain.

### 4.1 Go to Google Cloud Console

Visit: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

### 4.2 Edit OAuth Client

1. Click your OAuth 2.0 Client ID
2. Add to **Authorized JavaScript origins**:
   ```
   https://your-project.vercel.app
   ```

3. Add to **Authorized redirect URIs**:
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```

4. **Click Save**

**⚠️ CRITICAL:** Without this, Google OAuth login will fail!

---

## ⏰ Step 5: Configure Automated Cron Jobs

Choose ONE option based on your needs:

### **Option A: Vercel Cron (Default - Already Configured)**

✅ **Pros:**
- Built-in, no external service needed
- Automatic authentication via `x-vercel-cron` header
- No manual setup required

❌ **Cons:**
- Hobby plan: 1 cron job limit
- Minimum 10-minute intervals
- 1 invocation per minute max

**Configuration:**
The `vercel.json` is already configured with:
```json
{
  "crons": [{
    "path": "/api/cron/check-alerts",
    "schedule": "*/10 * * * *"
  }]
}
```

This runs every 10 minutes automatically. **No additional setup needed!**

### **Option B: cron-job.org (Alternative - Better Free Tier)**

✅ **Pros:**
- Supports 1-minute precision for free
- Unlimited cron jobs on free tier
- More flexible scheduling
- Better monitoring dashboard

❌ **Cons:**
- Requires external account
- Manual configuration needed

**Setup Steps:**

1. **Disable Vercel Cron** (if switching from Option A)

   Edit `vercel.json`:
   ```json
   {
     "crons": []
   }
   ```
   Then commit and redeploy.

2. **Create Account**

   Go to [https://cron-job.org](https://cron-job.org) and sign up (free).

3. **Create New Cron Job**

   Click **"Create Cronjob"** and configure:

   **Basic Settings:**
   - **Title:** `AlertFrame - Check Alerts`
   - **URL:** `https://your-project.vercel.app/api/cron/check-alerts`
   - **Request method:** `GET`

   **Schedule:**
   - **Execute every:** `5 minutes` (recommended)
   - Or: `1 minute` for testing
   - Or: Custom schedule

   **Advanced:**
   - Click **"Request headers"**
   - Add header:
     - **Name:** `Authorization`
     - **Value:** `Bearer YOUR_CRON_SECRET_VALUE`
     (Use the same value as `CRON_SECRET` in Vercel env vars)

   **Notifications (Optional):**
   - Enable "Execution failed" notification
   - Add your email

4. **Save and Enable**

   Click **"Create Cronjob"** and ensure it's enabled (green toggle).

5. **Test Immediately**

   Click **"Run now"** button to test.

   Check **"Executions"** tab - should show:
   - ✅ Status: 200 OK
   - Response contains: `"success": true`

---

## ✅ Step 6: Post-Deployment Verification

### 6.1 Test the Application

**Visit your production URL:**
```
https://your-project.vercel.app
```

You should see the landing page.

### 6.2 Test Authentication

1. Click **"Sign in with Google"**
2. Complete OAuth flow
3. Grant Gmail permissions
4. Should redirect to dashboard

**If OAuth fails:**
- Check Google Cloud Console redirect URIs
- Check `NEXTAUTH_URL` in Vercel env vars
- Check browser console for errors

### 6.3 Create Test Alert

1. On homepage, enter URL: `https://news.ycombinator.com`
2. Click on first headline element
3. Configure alert:
   - Frequency: "Every 10 minutes"
   - Email notifications: Enabled
4. Click **"Create Alert"**
5. Check your email for confirmation

### 6.4 Manually Trigger Cron

Test the cron endpoint directly:

```bash
curl -X GET https://your-project.vercel.app/api/cron/check-alerts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "timestamp": "2025-01-10T12:34:56.789Z",
  "summary": {
    "alertsChecked": 1,
    "changesDetected": 0,
    "errors": 0
  },
  "details": [...],
  "duration": 2345
}
```

### 6.5 Check Vercel Logs

**Vercel Dashboard** → **Your Project** → **Deployments** → **Latest** → **View Function Logs**

Look for:
```
🔍 CRON JOB STARTED - 2025-01-10T12:34:56.789Z
📊 Found 1 alerts due for checking
✅ Check completed successfully
```

### 6.6 Monitor Cron Executions

**If using cron-job.org:**
- Go to your cron-job.org dashboard
- Check "Executions" tab
- Should see successful runs every X minutes
- Status should be 200 OK

**If using Vercel Cron:**
- Check Vercel function logs
- Should see automated executions every 10 minutes

### 6.7 Test Email Notifications

**Option 1: Wait for real change**
- Monitor a frequently-changing site
- Wait for next cron run
- Check your email

**Option 2: Trigger change manually**
- Use a test site like `https://time.is` (changes every second)
- Create alert monitoring the time element
- Wait 1-2 minutes for cron
- Check email for change notification

---

## 🔍 Step 7: Monitoring & Debugging

### 7.1 View Real-Time Logs

```bash
# Stream live logs from Vercel
vercel logs --follow
```

Or: **Vercel Dashboard** → **Your Project** → **Logs**

### 7.2 Check Function Performance

**Vercel Dashboard** → **Your Project** → **Analytics**

Monitor:
- Function execution time
- Error rates
- Invocation counts

### 7.3 Database Monitoring

**Supabase Dashboard** → **Your Project** → **Database**

Check:
- Active connections
- Query performance
- Table sizes

### 7.4 Common Issues & Solutions

#### ❌ "OAuth redirect URI mismatch"

**Problem:** Google OAuth fails with redirect error

**Solution:**
1. Go to Google Cloud Console
2. Verify redirect URI matches EXACTLY:
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```
3. No trailing slash, exact domain match

#### ❌ "Database connection failed"

**Problem:** Can't connect to database

**Solution:**
1. Check `DATABASE_URL` in Vercel env vars
2. Use "Session Pooler" connection string from Supabase
3. Verify database is not paused (Supabase free tier auto-pauses)
4. Test connection: `npx prisma db pull`

#### ❌ "Cron not running"

**Problem:** Alerts not being checked

**Solution:**

**If using Vercel Cron:**
1. Check `vercel.json` has cron configured
2. Verify deployment includes latest `vercel.json`
3. Check function logs for cron executions

**If using cron-job.org:**
1. Check cron is enabled (green toggle)
2. Verify URL is correct
3. Check Authorization header matches `CRON_SECRET`
4. View execution history for errors

#### ❌ "Scraping fails on Vercel"

**Problem:** Puppeteer errors in production

**Solution:**
1. Verify `@sparticuz/chromium` is installed
2. Check function timeout is set (see `vercel.json`)
3. Upgrade to Vercel Pro for longer timeouts if needed
4. Check Vercel function logs for specific error

#### ❌ "Emails not sending"

**Problem:** No notifications received

**Solution:**
1. Check Gmail OAuth is connected (Settings page)
2. Verify user has granted Gmail send permission
3. Check Vercel logs for email errors
4. Test with Resend fallback if Gmail fails
5. Check spam folder

#### ❌ "Environment variable not found"

**Problem:** App crashes with missing env var error

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all required vars are set for **Production**
3. Redeploy: `vercel --prod`

---

## 🎯 Step 8: Custom Domain (Optional)

### 8.1 Add Domain in Vercel

**Vercel Dashboard** → **Your Project** → **Settings** → **Domains**

1. Click **"Add"**
2. Enter your domain: `alertframe.com`
3. Follow DNS configuration instructions

### 8.2 Update DNS Records

Add these records at your domain registrar:

**For apex domain (alertframe.com):**
```
A     @     76.76.21.21
```

**For www subdomain:**
```
CNAME www   cname.vercel-dns.com
```

### 8.3 Update Environment Variables

Once domain is verified:

1. Update in Vercel:
   ```bash
   NEXTAUTH_URL=https://alertframe.com
   APP_URL=https://alertframe.com
   ```

2. Update Google OAuth:
   - Add new domain to redirect URIs:
     ```
     https://alertframe.com/api/auth/callback/google
     ```

3. Redeploy: `vercel --prod`

---

## 📊 Performance Optimization

### 9.1 Vercel Function Timeouts

**Hobby Plan:** 10-second timeout (may be insufficient for scraping)

**Pro Plan:** Up to 300 seconds (5 minutes)

If scraping frequently times out:
- Upgrade to Vercel Pro
- Or optimize scraping (reduce wait times, simpler selectors)

### 9.2 Database Connection Pooling

Vercel serverless functions open many connections.

**Recommended:**
- Use Supabase "Session Pooler" connection string
- Set `pgbouncer=true` in connection string
- Monitor connections in Supabase dashboard

### 9.3 Cron Job Frequency

**Recommendations:**
- **Development:** 1-2 minutes (for testing)
- **Production:** 5-10 minutes (balance freshness vs cost)
- **High-traffic:** Consider upgrading to Vercel Pro

---

## 🔒 Security Best Practices

### 10.1 Environment Variables

- ✅ Never commit `.env` to git (already in `.gitignore`)
- ✅ Use `CRON_SECRET` to protect cron endpoint
- ✅ Rotate secrets periodically
- ✅ Use Vercel's encrypted environment variables

### 10.2 Database Security

- ✅ Use Supabase Row-Level Security (RLS)
- ✅ Never expose database directly to frontend
- ✅ Use Prisma for safe queries
- ✅ Encrypt sensitive data (OAuth tokens use `ENCRYPTION_KEY`)

### 10.3 API Rate Limiting

Consider adding rate limiting to API routes:
- Protect cron endpoint with auth
- Limit user API calls
- Monitor for abuse in Vercel analytics

---

## 📚 Additional Resources

### Documentation
- [README.md](./README.md) - Project overview
- [.env.production.example](./.env.production.example) - Environment template

### External Services
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Google Cloud Console:** https://console.cloud.google.com
- **cron-job.org:** https://cron-job.org (if using external cron)
- **Resend Dashboard:** https://resend.com/emails (for email logs)

### Useful Commands

```bash
# Deploy to production
vercel --prod

# View live logs
vercel logs --follow

# Pull environment variables
vercel env pull .env.production

# Test build locally
npm run build

# Check database connection
npx prisma db pull

# Open Prisma Studio
npx prisma studio
```

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is configured:

### Pre-Deployment
- [ ] All code changes committed
- [ ] `@sparticuz/chromium` installed
- [ ] GitHub repository up to date

### Vercel Setup
- [ ] Deployed to Vercel
- [ ] Production environment variables set
- [ ] `NEXTAUTH_URL` matches production domain
- [ ] `APP_URL` matches production domain
- [ ] Function timeout configured

### Google OAuth
- [ ] Redirect URIs updated with production domain
- [ ] JavaScript origins updated
- [ ] OAuth consent screen configured

### Cron Configuration
- [ ] Cron service chosen (Vercel or cron-job.org)
- [ ] Cron schedule configured
- [ ] Authorization header set (if using cron-job.org)
- [ ] Manual cron test successful

### Verification
- [ ] App loads at production URL
- [ ] Google OAuth login works
- [ ] Gmail permissions granted
- [ ] Test alert created
- [ ] Confirmation email received
- [ ] Cron job runs automatically
- [ ] Change detection works
- [ ] Notification emails received

### Monitoring
- [ ] Vercel logs accessible
- [ ] Cron executions visible
- [ ] Error alerts configured
- [ ] Performance acceptable

---

## 🎉 Deployment Complete!

Your AlertFrame instance is now live and monitoring the web!

**What's Next?**

1. **Test thoroughly** - Create multiple alerts, test different websites
2. **Monitor performance** - Check Vercel logs and function metrics
3. **Optimize cron frequency** - Adjust based on needs and costs
4. **Add custom domain** - For professional branding
5. **Scale up** - Upgrade to Vercel Pro if needed for more features

**Need Help?**

- Check troubleshooting section above
- Review Vercel function logs
- Test locally first: `npm run dev` + `npm run worker`
- Verify all environment variables are set correctly

---

**Built with Next.js, Prisma, Puppeteer, and Gmail OAuth**
**Deployed on Vercel Serverless Platform**
