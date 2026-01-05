# Google Sheets API Setup Guide

This guide will walk you through setting up Google Sheets as the database for your Pharmacy Management System.

## Why Google Sheets?

For Phase 1, we're using Google Sheets as a quick and free database solution. It allows you to:
- Start using the app immediately
- View/edit data directly in Google Sheets
- Zero setup cost
- Easy migration to a proper database later

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Name it: **"Pharmacy Management System"**
4. Click **"Create"**

### Step 2: Enable APIs

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"** and click **Enable**
3. Search for **"Google Drive API"** and click **Enable**

### Step 3: Create Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in:
   - **Service account name**: `pharmacy-app-service`
   - **Service account ID**: (auto-generated)
   - **Description**: Service account for Pharmacy Management System
4. Click **"Create and Continue"**
5. Skip the optional steps, click **"Done"**

### Step 4: Generate Service Account Key

1. In the **Credentials** page, find your service account in the list
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Select **JSON** format
6. Click **"Create"** - a JSON file will download

### Step 5: Extract Credentials from JSON

Open the downloaded JSON file. You'll need two values:

```json
{
  "client_email": "pharmacy-app-service@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour very long private key here\n-----END PRIVATE KEY-----\n"
}
```

### Step 6: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"Blank"** to create a new spreadsheet
3. Name it: **"Pharmacy Database"**
4. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Step 7: Share Spreadsheet with Service Account

1. In your Google Spreadsheet, click **"Share"**
2. Paste the **service account email** (from Step 5)
3. Set permission to **"Editor"**
4. Uncheck **"Notify people"**
5. Click **"Share"**

### Step 8: Create "Sales" Sheet

1. In your spreadsheet, rename "Sheet1" to **"Sales"**
2. Add the following column headers in row 1:
   - `id` (Column A)
   - `sale_date` (Column B)
   - `total_amount` (Column C)
   - `payment_method` (Column D)
   - `notes` (Column E)
   - `created_at` (Column F)

### Step 9: Configure Environment Variables

1. In your project folder `d:\Code\PMS\pharmacy-app`, create a file named `.env.local`
2. Add the following (replace with your actual values):

```env
# Google Sheets API
VITE_GOOGLE_SHEETS_CLIENT_EMAIL=pharmacy-app-service@your-project.iam.gserviceaccount.com
VITE_GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id-here
```

**IMPORTANT**: The private key must be wrapped in double quotes and include the `\n` characters.

### Step 10: Test the Connection

Once you've configured the environment variables, we'll create a service module to test the connection. This will be done in the code implementation.

## Troubleshooting

### "The caller does not have permission"
- Make sure you shared the spreadsheet with the service account email
- Verify the service account has **Editor** permissions

### "Invalid credentials"
- Check that the private key is properly formatted in `.env.local`
- Ensure the key is wrapped in double quotes
- Verify `\n` characters are preserved (don't replace with actual line breaks)

### "Spreadsheet not found"
- Verify the Spreadsheet ID is correct
- Check that the spreadsheet is shared with the service account

## Security Notes

- **NEVER commit `.env.local` to Git** (it's already in .gitignore)
- Keep your service account key file secure
- Don't share your private key with anyone
- Use separate service accounts for production vs development

## Next Steps

Once you've completed this setup:
1. Confirm the spreadsheet is created and shared
2. Verify `.env.local` is configured correctly
3. We'll proceed to create the Google Sheets service module and test the connection

---

**Need Help?** If you encounter any issues during setup, please let me know which step you're stuck on!
