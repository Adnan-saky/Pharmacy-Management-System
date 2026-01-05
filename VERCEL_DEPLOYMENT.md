# Vercel Deployment Guide for Pharmacy Management System

This guide will walk you through deploying your Pharmacy Management System to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Google Sheets Credentials**: Your Google Service Account JSON file

## Deployment Steps

### Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 2: Prepare Your Environment Variables

You need to set up the following environment variables in Vercel:

#### Required Environment Variables:

1. **JWT_SECRET** - Your JWT secret key
2. **GOOGLE_SHEETS_SPREADSHEET_ID** - Your Google Sheets ID
3. **GOOGLE_SERVICE_ACCOUNT_EMAIL** - Service account email
4. **GOOGLE_PRIVATE_KEY** - Service account private key

#### How to Get Google Credentials:

From your `formidable-bus-481305-r0-5f5b1d553cdd.json` file:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email` field
- `GOOGLE_PRIVATE_KEY` = `private_key` field (keep the `\n` characters)

### Step 3: Deploy via Vercel Dashboard (Easiest Method)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New Project"**
3. **Import your Git repository**
4. **Configure your project:**
   - Framework Preset: **Vite**
   - Root Directory: `pharmacy-app` (if not already in root)
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Add Environment Variables:**
   - Go to "Environment Variables" section
   - Add each variable listed above
   - **IMPORTANT**: For `GOOGLE_PRIVATE_KEY`, paste the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - Make sure to keep the `\n` newline characters in the private key

6. **Click "Deploy"**

### Step 4: Deploy via Vercel CLI (Alternative Method)

```bash
# Navigate to your project directory
cd d:\Code\PMS\pharmacy-app

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - What's your project's name? pharmacy-management-system
# - In which directory is your code located? ./
# - Want to override the settings? No

# Add environment variables
vercel env add GOOGLE_SHEETS_SPREADSHEET_ID
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
vercel env add JWT_SECRET

# Deploy to production
vercel --prod
```

### Step 5: Verify Deployment

1. **Check the deployment URL** provided by Vercel
2. **Test the health endpoint**: `https://your-app.vercel.app/api/health`
3. **Try logging in** with your credentials
4. **Verify Google Sheets connection** by checking if data loads

## Important Notes

### Google Private Key Format

When adding `GOOGLE_PRIVATE_KEY` to Vercel:
- Copy the ENTIRE private key from your JSON file
- Include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep all `\n` characters (they represent newlines)
- In Vercel dashboard, paste it as-is
- In CLI, you may need to wrap it in quotes

Example format:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----\n
```

### Environment Variables Checklist

Before deploying, make sure you have:
- [ ] JWT_SECRET (create a strong random string)
- [ ] GOOGLE_SHEETS_SPREADSHEET_ID (from your Google Sheets URL)
- [ ] GOOGLE_SERVICE_ACCOUNT_EMAIL (from JSON file)
- [ ] GOOGLE_PRIVATE_KEY (from JSON file, with \n characters)

### Troubleshooting

#### Issue: "Google Sheets connection failed"
**Solution**: 
- Verify your `GOOGLE_PRIVATE_KEY` includes all newline characters (`\n`)
- Make sure the service account has access to your Google Sheet
- Check that the spreadsheet ID is correct

#### Issue: "Authentication failed"
**Solution**:
- Verify `JWT_SECRET` is set
- Check that your user credentials are correct
- Ensure the Users sheet in Google Sheets has valid data

#### Issue: "Build failed"
**Solution**:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify `vercel.json` configuration is correct

#### Issue: "API routes not working"
**Solution**:
- Check that `vercel.json` routing is correct
- Verify `/api` folder structure
- Check serverless function logs in Vercel dashboard

### Post-Deployment Tasks

1. **Update API URL in Frontend** (if needed):
   - Check `src/config/config.backend.js`
   - Ensure it uses relative URLs (`/api/...`) or environment-based URLs

2. **Test All Features**:
   - Login/Authentication
   - Sales entry
   - Reports generation
   - All CRUD operations

3. **Set up Custom Domain** (Optional):
   - Go to Vercel project settings
   - Add your custom domain
   - Update DNS records as instructed

## Continuous Deployment

Once set up, Vercel will automatically:
- Deploy on every push to your main branch
- Create preview deployments for pull requests
- Run builds and tests

## Monitoring

Access your deployment logs and analytics:
- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Logs**: Click on your project → Deployments → View Function Logs
- **Analytics**: Available in the project dashboard

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review the troubleshooting section above
3. Check [Vercel documentation](https://vercel.com/docs)

---

**Deployment Date**: 2026-01-04
**Version**: 1.0.0
