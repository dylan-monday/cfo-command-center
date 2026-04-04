# CFO Command Center - Deployment Guide

## Prerequisites

- Vercel account with Pro plan (required for cron jobs)
- Supabase project with schema deployed
- Google Cloud project with Gmail and Drive APIs enabled
- Domain: cfo.mondayandpartners.com configured

## Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Anthropic Claude
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Google APIs (Gmail + Drive)
```
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REFRESH_TOKEN=1//...
GOOGLE_DRIVE_FOLDER_ID=1abc...xyz (CPA exports folder)
```

### Notifications
```
NOTIFICATION_EMAIL=dylan@mondayandpartners.com
```

### Cron Security
```
CRON_SECRET=your-secure-random-string
```

### App URL
```
NEXT_PUBLIC_APP_URL=https://cfo.mondayandpartners.com
```

## Deployment Steps

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import Git Repository → Select `dylandibona/cfo-command-center`
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Add Environment Variables

1. Go to Project Settings → Environment Variables
2. Add all variables listed above
3. Select "Production", "Preview", and "Development" for each

### 4. Deploy

1. Vercel will auto-deploy on push to main
2. First deployment will be at `cfo-command-center.vercel.app`

### 5. Configure Custom Domain

1. Go to Project Settings → Domains
2. Add `cfo.mondayandpartners.com`
3. Update DNS records as instructed:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or A record to Vercel's IP

### 6. Verify Cron Jobs

Vercel will automatically run cron jobs based on `vercel.json`:

| Job | Schedule | Description |
|-----|----------|-------------|
| `/api/cron/staleness-check` | 6 AM UTC daily | Knowledge freshness audit |
| `/api/cron/weekly-digest` | 8 AM UTC Mondays | Weekly summary email |
| `/api/cron/deadline-check` | 9 AM UTC daily | Deadline reminders |

Monitor cron execution in Vercel Dashboard → Functions → Cron.

### 7. Seed Production Database

Run the seed script against production Supabase:

```bash
# Set production env vars
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Run seed
npm run seed
```

## Post-Deployment Checklist

- [ ] Verify homepage loads at https://cfo.mondayandpartners.com
- [ ] Test chat functionality with Claude API
- [ ] Verify entities load from Supabase
- [ ] Test email notifications (trigger a deadline check)
- [ ] Verify Google Drive export works
- [ ] Check cron jobs are scheduled in Vercel dashboard
- [ ] Confirm SSL certificate is active

## Monitoring

### Vercel Dashboard
- Function logs: Vercel Dashboard → Functions
- Cron logs: Vercel Dashboard → Functions → Cron
- Deployment logs: Vercel Dashboard → Deployments

### Supabase Dashboard
- Database queries: Supabase Dashboard → SQL Editor
- Storage usage: Supabase Dashboard → Storage
- Auth users: Supabase Dashboard → Authentication

## Troubleshooting

### Cron Jobs Not Running
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check Vercel Pro plan is active (crons require Pro)
3. Review function logs for errors

### Email Not Sending
1. Verify Google API credentials are valid
2. Check refresh token hasn't expired
3. Ensure Gmail API is enabled in Google Cloud Console

### Claude API Errors
1. Verify `ANTHROPIC_API_KEY` is valid
2. Check API usage limits
3. Review function logs for specific errors

### Database Connection Issues
1. Verify Supabase project is running
2. Check service role key permissions
3. Ensure RLS policies allow authenticated access

## Rollback

To rollback to a previous deployment:

1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "..." menu → "Promote to Production"

## Security Notes

- All API routes use server-side Supabase client
- Cron endpoints require `CRON_SECRET` authorization
- RLS policies protect all database tables
- Storage bucket is private (authenticated access only)
- No sensitive data in client-side code
