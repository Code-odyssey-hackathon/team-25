# 🏠 Local Development Guide - JanaVaani

## Current Status: Using Cloud Supabase (No Local Setup Required!)

**Good News:** You can develop right now using the **cloud Supabase** that's already configured. No need to install Docker immediately!

---

## 🚀 Quick Start (Cloud Development)

Since you already have cloud Supabase working, you can start developing immediately:

```bash
# 1. Go to project directory
cd d:\BVB\team-25

# 2. Install dependencies (if not done)
npm install

# 3. Start Next.js dev server
npm run dev
```

**Your app will:**
- ✅ Use cloud Supabase (https://levkuuwyqnbauzynvppp.supabase.co)
- ✅ Have all 15 database migrations already applied
- ✅ Work immediately - no setup needed!

---

## 📊 Current Working Setup

| Component | Status | URL |
|-----------|--------|-----|
| **Supabase** | ✅ Live (Cloud) | https://levkuuwyqnbauzynvppp.supabase.co |
| **Next.js Dev** | Run locally | http://localhost:3000 |
| **Database** | ✅ Connected | Cloud PostgreSQL |
| **Auth** | ✅ Working | Cloud Auth |
| **Storage** | ✅ Working | Cloud Storage |

---

## 🔄 When to Set Up Local Supabase

### Option 1: Develop Against Cloud (EASIER - RECOMMENDED FOR NOW)
✅ **Pros:**
- No Docker/CLI installation needed
- Data persists in cloud
- Team can share same database
- Edge Functions work in cloud

❌ **Cons:**
- Need internet connection
- Rate limits may apply
- Testing affects production data

**Best for:** Quick development, testing, small teams

---

### Option 2: Local Supabase (FOR LATER)
✅ **Pros:**
- Works offline
- Faster local queries
- Isolated testing
- No rate limits

❌ **Cons:**
- Need Docker (~2GB download)
- Need to install Supabase CLI
- Need to apply migrations locally
- More complex setup

**Best for:** Large teams, offline work, extensive testing

---

## 🧪 Testing Your App

### 1. Test Supabase Connection
```bash
node supabase_health_check.mjs
```

### 2. Check Deployment Readiness
```bash
node deploy_readiness_check.mjs
```

### 3. Test API Endpoints
```bash
node test_local_api.mjs
```

---

## 📁 Environment Files Explained

| File | Purpose | When Used |
|------|---------|-----------|
| `.env` | Production/Cloud credentials | Always (base config) |
| `.env.local` | Override for local dev | When present (takes priority) |
| `.env.example` | Template for new devs | Reference only |

**Next.js Priority:** `.env.local` > `.env` > System env

---

## 🔧 Switching Between Local and Cloud

Use the helper script:

```bash
# Switch to local (after setting up local Supabase)
node switch_env.mjs local

# Switch back to cloud
node switch_env.mjs production
```

---

## 📋 Local Setup Checklist (Do This Later)

When you're ready for local development:

- [ ] Install Docker Desktop
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Initialize: `supabase init`
- [ ] Start services: `supabase start`
- [ ] Copy credentials: `supabase status`
- [ ] Create `.env.local` with local keys
- [ ] Apply migrations: `supabase db reset`
- [ ] Test local connection

---

## 🐳 Local Supabase Services (After Setup)

Once local Supabase is running:

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:54321 | Main Supabase API |
| Database | postgresql://localhost:54322 | PostgreSQL directly |
| Studio | http://localhost:54323 | Web GUI (like phpMyAdmin) |
| Inbucket | http://localhost:54324 | Test email catcher |
| Edge Functions | http://localhost:54321/functions/v1 | Local Edge Functions |

---

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- Check internet connection
- Verify `.env` has correct cloud URL
- Run: `node supabase_health_check.mjs`

### "npm install fails"
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run: `npm install`

### "Build fails"
- Check for syntax errors in your code
- Run: `npm run build` to see full errors

---

## 💡 Recommendation

**For now, develop against the cloud Supabase.** It's already:
- ✅ Configured
- ✅ Working
- ✅ Has all migrations applied
- ✅ Ready for development

**Later, when you want:**
- Offline development
- Isolated testing
- Faster queries

**Then set up local Supabase following the checklist above.**

---

## 🎯 Next Steps

1. **Start developing now:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

2. **Test your features** against the live cloud database

3. **When everything works**, deploy to Vercel:
   ```bash
   vercel --prod
   ```

4. **Later (optional)**: Set up local Supabase for offline work

---

## 📚 Helpful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production build

# Testing
node supabase_health_check.mjs    # Test Supabase connection
node deploy_readiness_check.mjs   # Check deployment readiness

# Environment switching
node switch_env.mjs local         # Use local Supabase
node switch_env.mjs production    # Use cloud Supabase

# Local Supabase (after setup)
supabase start           # Start local services
supabase stop            # Stop local services
supabase status          # Show local credentials
supabase db reset        # Reset local DB
```

---

## ✅ You're Ready!

Your cloud Supabase is **working perfectly**. Start coding now:

```bash
cd d:\BVB\team-25
npm run dev
```

Happy coding! 🚀
