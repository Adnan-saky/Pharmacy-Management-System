# Vercel Deployment Checklist

## Pre-Deployment

- [ ] All code is committed to Git repository
- [ ] Repository is pushed to GitHub/GitLab/Bitbucket
- [ ] Google Sheets is set up with proper permissions
- [ ] Service account JSON file is available
- [ ] All environment variables are documented

## Environment Variables Setup

- [ ] JWT_SECRET (create a strong random string)
- [ ] GOOGLE_SHEETS_SPREADSHEET_ID
- [ ] GOOGLE_SERVICE_ACCOUNT_EMAIL
- [ ] GOOGLE_PRIVATE_KEY (with \n characters preserved)

## Deployment Steps

### Option 1: Vercel Dashboard (Recommended)

1. [ ] Go to [vercel.com](https://vercel.com) and sign in
2. [ ] Click "Add New Project"
3. [ ] Import your Git repository
4. [ ] Configure project settings:
   - Framework: Vite
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
5. [ ] Add all environment variables
6. [ ] Click "Deploy"
7. [ ] Wait for deployment to complete

### Option 2: Vercel CLI

1. [ ] Install Vercel CLI: `npm install -g vercel`
2. [ ] Login: `vercel login`
3. [ ] Deploy: `vercel`
4. [ ] Add environment variables via CLI or dashboard
5. [ ] Deploy to production: `vercel --prod`

## Post-Deployment Verification

- [ ] Visit deployment URL
- [ ] Test health endpoint: `/api/health`
- [ ] Test login functionality
- [ ] Verify Google Sheets connection
- [ ] Test creating a sale
- [ ] Test viewing reports
- [ ] Test all major features:
  - [ ] Sales
  - [ ] Suppliers
  - [ ] Medicine Costs
  - [ ] Operational Costs
  - [ ] Petty Cash
  - [ ] Investments
  - [ ] Dashboard
  - [ ] Reports

## Troubleshooting

If deployment fails, check:
- [ ] Build logs in Vercel dashboard
- [ ] Environment variables are set correctly
- [ ] Google Sheets permissions
- [ ] Private key format (must include \n)
- [ ] Function logs for runtime errors

## Optional: Custom Domain

- [ ] Add custom domain in Vercel settings
- [ ] Update DNS records
- [ ] Verify SSL certificate

## Notes

- Deployment URL: ___________________________
- Deployed on: ___________________________
- Version: 1.0.0
