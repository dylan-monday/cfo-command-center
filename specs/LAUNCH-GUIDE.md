# CFO Command Center — Launch Guide
## Exact steps to go from zero to building

---

### BEFORE YOU TOUCH CLAUDE CODE

#### Step 1: Create a Supabase Project
1. Go to supabase.com, sign in
2. Click "New Project"
3. Name it `cfo-command-center`
4. Set a strong database password (save it somewhere)
5. Choose region: US East (closest to NOLA)
6. Wait for it to provision (~2 minutes)
7. Go to Settings → API and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...` — keep this secret)

#### Step 2: Create a Supabase Storage Bucket
1. In your Supabase dashboard, go to Storage
2. Click "New Bucket"
3. Name it `documents`
4. Set it to "Private" (authenticated access only)

#### Step 3: Get Your Claude API Key
1. Go to console.anthropic.com
2. Go to API Keys
3. Create a new key, name it `cfo-command-center`
4. Copy the key (starts with `sk-ant-...`)
5. Add some credits if you haven't ($20 is plenty to start)

#### Step 4: Set Up Google Cloud for Gmail API
1. Go to console.cloud.google.com
2. Create a new project called `CFO Command Center`
3. Go to APIs & Services → Library
4. Search for and enable: **Gmail API** and **Google Drive API**
5. Go to APIs & Services → Credentials
6. Click "Configure Consent Screen"
   - User type: Internal (since you have Google Workspace)
   - App name: CFO Command Center
   - User support email: your email
   - Save
7. Go back to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: CFO Command Center
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
   - Click Create
   - Copy **Client ID** and **Client Secret**
8. You'll get the refresh token during the build process (Claude Code will help)

#### Step 5: Create a Google Drive Folder
1. In Google Drive, create a folder called `CFO Command Center`
2. Inside it, create subfolders: `Tax 2025`, `Tax 2026`, `Quarterly Memos`, `CPA Packets`
3. Right-click the main folder → Get link → Copy the folder ID from the URL
   (it's the long string after `/folders/` in the URL)

---

### INSTALL CLAUDE CODE

#### Step 6: Install Claude Code
**On Mac (recommended):**
Open Terminal and run:
```
curl -fsSL https://claude.ai/install.sh | sh
```

**Or via Homebrew:**
```
brew install --cask claude-code
```

**On Windows:**
Open PowerShell and run:
```
irm https://claude.ai/install.ps1 | iex
```
(Requires Git for Windows installed first)

#### Step 7: Authenticate Claude Code
1. Open Terminal
2. Type `claude` and hit Enter
3. Your browser will open — sign in with your Claude account
4. Come back to Terminal, you're authenticated

You need a Claude Pro plan ($20/mo) minimum. You already have this.

---

### START BUILDING

#### Step 8: Create the Project Folder
```
mkdir cfo-command-center
cd cfo-command-center
```

#### Step 9: Copy the Spec Files In
Copy the entire `cfo-command-center-specs` folder into your project:
```
cp -r /path/to/downloaded/cfo-command-center-specs ./specs
```

Your folder should now look like:
```
cfo-command-center/
└── specs/
    ├── CLAUDE.md
    ├── 01-Tech-Spec-v1.docx
    ├── 02-Addendum-Stack-Design-Notifications.docx
    ├── 03-Addendum-Household-Tax-Strategy.docx
    ├── 04-Addendum-Document-Ingestion.docx
    └── 05-Addendum-Property-Integration.docx
```

#### Step 10: Move CLAUDE.md to the Root
```
cp specs/CLAUDE.md ./CLAUDE.md
```

This is critical — Claude Code reads CLAUDE.md from the project root at the start of every session.

#### Step 11: Launch Claude Code and Start Building
```
claude
```

Then give it this first prompt:

```
Read the CLAUDE.md file in this project root, then read all 5 spec 
documents in the /specs/ folder (01 through 05). These are .docx files.

Once you've read everything, execute Phase 1: Create the Next.js app 
scaffold with TypeScript, Tailwind, and App Router. Install all 
dependencies listed in the spec. Create a .env.local file with 
placeholder values for all required environment variables.

Here are my actual values (fill these in):
- NEXT_PUBLIC_SUPABASE_URL=[paste your URL]
- NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste your anon key]
- SUPABASE_SERVICE_ROLE_KEY=[paste your service role key]
- ANTHROPIC_API_KEY=[paste your Claude API key]
- GOOGLE_CLIENT_ID=[paste from Step 4]
- GOOGLE_CLIENT_SECRET=[paste from Step 4]
- NOTIFICATION_EMAIL=dylan@mondayandpartners.com
```

#### Step 12: Continue Through the Phases
After Phase 1 completes, tell Claude Code:
```
Phase 1 is done. Execute Phase 2: Create the Supabase migration SQL 
for all 12 tables from the spec, with RLS policies. Then run the seed 
data for all 7 entities, all accounts, all knowledge base entries, 
all tax strategies, and all proactive queue items.
```

Continue through Phases 3-9 the same way. Each phase builds on the last.

---

### TIPS FOR WORKING WITH CLAUDE CODE

- **Use /plan for complex phases.** Type `/plan` before asking Claude Code to execute a phase. It'll think through the approach before writing code.
- **Review diffs before approving.** Claude Code shows you what it's about to change. Read it.
- **If it makes a mistake, say so.** "That's wrong, here's what I need instead..." works fine.
- **One phase at a time.** Don't try to do all 10 phases in one prompt. Each phase should be a focused session.
- **Git commit after each phase.** After each phase works, run `git add . && git commit -m "Phase X complete"` so you have checkpoints.
- **The spec docs are your source of truth.** If Claude Code seems confused, point it back to the specific section of the spec.

---

### DEPLOY

#### Step 13: Push to GitHub
```
git init
git add .
git commit -m "Initial build"
git remote add origin https://github.com/yourusername/cfo-command-center.git
git push -u origin main
```

#### Step 14: Connect to Vercel
1. Go to vercel.com, sign in
2. Click "Import Project" → select your GitHub repo
3. Framework: Next.js (auto-detected)
4. Add all environment variables from .env.local
5. Deploy

#### Step 15: Configure Domain
1. In Vercel project settings → Domains
2. Add `cfo.mondayandpartners.com`
3. Follow the DNS instructions (add CNAME record in your domain registrar)

---

### YOU'RE LIVE

The system will be running at cfo.mondayandpartners.com with:
- Full chat interface with your complete financial context
- Dynamic dashboard with alerts, entity map, tax strategies
- Document upload and AI parsing
- Weekly email digests (once cron jobs are configured in vercel.json)
- Everything pre-seeded with your financial life

Start by uploading a few statements and chatting with your CFO.
