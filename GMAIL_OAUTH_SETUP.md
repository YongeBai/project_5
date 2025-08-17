# Gmail OAuth Setup Guide

This guide will help you set up Gmail OAuth2 authentication for this application, with support for both Gmail API and IMAP/SMTP access through EmailEngine.

## Current Implementation Status

✅ **What's Already Implemented:**
- OAuth2 authentication flow with Google
- Gmail API integration for reading and modifying emails
- Email clustering functionality
- API endpoints for authentication and email management

⚠️ **What Needs Configuration:**
1. Google Cloud Console project setup
2. OAuth2 credentials
3. Environment variables
4. (Optional) EmailEngine integration for IMAP/SMTP

## Step-by-Step Setup Instructions

### 1. Google Cloud Console Setup

#### Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name your project (e.g., "Email Clustering App")
4. Select the created project from the dropdown

#### Enable Gmail API
1. Navigate to **APIs & Services → Enabled APIs and services**
2. Click **+ ENABLE APIS AND SERVICES**
3. Search for "Gmail API"
4. Click on it and press **ENABLE**

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose user type:
   - **Internal**: For Google Workspace users only
   - **External**: For any Gmail user (requires app verification for production)
3. Fill in the application information:
   - **App name**: Your application name
   - **User support email**: Your email
   - **Application home page**: `http://localhost:3000` (for development)
   - **Authorized domains**: Add your production domain if applicable
4. Click **Save and Continue**

#### Configure Scopes
1. Click **ADD OR REMOVE SCOPES**
2. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` - Read emails
   - `https://www.googleapis.com/auth/gmail.modify` - Modify emails (archive, etc.)
   - `https://mail.google.com` - Full IMAP/SMTP access (for EmailEngine)
3. Click **UPDATE** and then **SAVE AND CONTINUE**

### 3. Create OAuth2 Credentials

1. Navigate to **APIs & Services → Credentials**
2. Click **+ CREATE CREDENTIALS → OAuth client ID**
3. Select **Web application** as the application type
4. Configure the OAuth client:
   - **Name**: Your app name
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - Your production URL
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback` (development)
     - Your production callback URL
5. Click **CREATE**
6. **Download** the JSON file with your credentials

### 4. Configure Environment Variables

1. Create a `.env.local` file in your project root (copy from `env.example`):

```bash
cp env.example .env.local
```

2. Open the downloaded JSON file and copy the values:

```env
# From the downloaded JSON file
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Generate a random secret for NextAuth
NEXTAUTH_SECRET=your_random_secret_here
```

### 5. Test the Integration

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000`

3. Click the authentication button to start the OAuth flow

4. Grant the requested permissions

5. You should be redirected back to your app with access to Gmail

## Optional: EmailEngine Integration

If you want to use EmailEngine for IMAP/SMTP access instead of the Gmail API:

### Prerequisites
- EmailEngine instance running (self-hosted or cloud)
- EmailEngine API access

### Setup Steps

1. **Add EmailEngine credentials to `.env.local`:**
```env
EMAILENGINE_URL=https://your-emailengine-instance.com
EMAILENGINE_API_KEY=your_emailengine_api_key
```

2. **Configure EmailEngine OAuth2 App:**
   - Open EmailEngine dashboard
   - Create new Gmail OAuth2 application
   - Upload the same JSON credentials file from Google Cloud Console
   - Select "IMAP and SMTP" as base scope
   - Register the app

3. **Update redirect URIs in Google Cloud Console:**
   - Add: `https://your-emailengine-url.com/oauth`

## Important Security Notes

⚠️ **Never commit `.env.local` to version control!** It's already in `.gitignore`

⚠️ **For production:**
- Use proper session management instead of cookies
- Implement token refresh logic
- Use HTTPS for all URLs
- Store tokens securely (database with encryption)
- Implement proper error handling and logging

## Troubleshooting

### Common Issues

1. **"Access blocked" error:**
   - Ensure your app is verified (for External apps)
   - Check that all redirect URIs match exactly
   - Verify all required scopes are added

2. **"Invalid grant" error:**
   - Authorization code may be expired (use within 10 minutes)
   - Code may have been used already (codes are single-use)

3. **"Scope not authorized" error:**
   - Add missing scopes in OAuth consent screen
   - User needs to re-authenticate after scope changes

## Current Implementation Details

### API Endpoints

- `GET /api/auth` - Generates OAuth authorization URL
- `GET /api/auth/callback` - Handles OAuth callback and token exchange
- `GET /api/emails` - Fetches and clusters emails
- `POST /api/emails/archive` - Archives selected emails

### Key Files

- `/src/lib/gmail.ts` - Gmail service implementation
- `/src/app/api/auth/` - OAuth flow endpoints
- `/src/app/api/emails/` - Email management endpoints
- `/src/lib/clustering.ts` - Email clustering logic

## Next Steps

After completing the setup:

1. **Enhance Security:**
   - Implement proper session management
   - Add CSRF protection
   - Use encrypted storage for tokens

2. **Add Features:**
   - Email filtering options
   - Custom clustering parameters
   - Batch operations
   - Email search functionality

3. **EmailEngine Integration:**
   - Implement IMAP folder management
   - Add SMTP sending capabilities
   - Real-time email monitoring with webhooks

## Support

For issues related to:
- **Google OAuth**: Check [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- **Gmail API**: See [Gmail API Reference](https://developers.google.com/gmail/api)
- **EmailEngine**: Visit [EmailEngine Documentation](https://emailengine.app/docs)
