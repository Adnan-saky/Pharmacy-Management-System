# 🚀 Continuous Deployment with Git & Vercel

This guide explains how to set up an automated deployment pipeline. Every time you push code to GitHub (or GitLab/Bitbucket), Vercel will automatically rebuild and deploy your application.

## ⚠️ Prerequisite: Install Git
Since the `git` command failed in your terminal, you likely need to install it:
1. Download **Git for Windows**: [git-scm.com/download/win](https://git-scm.com/download/win)
2. Install it (Standard settings are fine).
3. **Restart your terminal/VS Code** after installation.

---

## Step 1: Secure Your Secrets (Crucial)
We have already updated your `.gitignore` to exclude sensitive files.
**VERIFY** that these files are NOT being tracked:
- `.env.local`
- `formidable-bus-....json` (Your Google Cloud Key)
- `.vercel` folder

---

## Step 2: Initialize Git Repository
Run these commands in your project folder (`d:\Code\PMS\pharmacy-app`):

```powershell
# 1. Initialize git (if not already done)
git init

# 2. Add all files to staging
git add .

# 3. Commit your code
git commit -m "Initial commit for Pharmacy App"
```

---

## Step 3: Push to GitHub
1. Go to [GitHub.com](https://github.com) and sign in.
2. Click **+** (top right) -> **New repository**.
3. Name it `pharmacy-app`.
4. Choose **Private** (Recommended for apps with business logic).
5. Click **Create repository**.
6. Copy the commands under "…or push an existing repository from the command line". They will look like this:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/pharmacy-app.git
git branch -M main
git push -u origin main
```
*Run these commands in your terminal.*

---

## Step 4: Connect Vercel to GitHub
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Under "Import Git Repository", you should see your new `pharmacy-app` repo.
   - If not, click **Adjust GitHub App Permissions** to grant access.
4. Click **Import**.

---

## Step 5: Configure Project in Vercel
Vercel will detect it's a Vite app.
1. **Framework Preset:** `Vite`
2. **Root Directory:** `./` (default)
3. **Environment Variables:** (Expand this section)
   You MUST add these variables for the app to work. Copy them from your `.env.local`:
   
   | Key | Value |
   |-----|-------|
   | `JWT_SECRET` | (Your secret key) |
   | `GOOGLE_SHEETS_SPREADSHEET_ID` | (Your spreadsheet ID) |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | (Your service account email) |
   | `GOOGLE_PRIVATE_KEY` | (Copy the WHOLE key from the JSON file, including -----BEGIN... and newlines) |

4. Click **Deploy**.

---

## 🎉 How Updates Work Now
1. You make changes to your code locally.
2. You commit and push:
   ```powershell
   git add .
   git commit -m "Fixed login bug"
   git push
   ```
3. Vercel **automatically detects the push** and starts building.
4. In 1-2 minutes, your live site is updated!

## 🆘 Troubleshooting
- **Build Fail during Deploy?** Check the Vercel "Logs" tab.
- **"Command not found: git"?** Install Git from Step 1.
- **App works but data is missing?** Check your Environment Variables in Vercel Settings.
