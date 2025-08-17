# Email Clustering App

An AI-powered Gmail inbox organizer that automatically groups similar emails and allows bulk archiving.

## Features

- 🔐 **Gmail OAuth2 Integration** - Secure authentication with Google
- 🤖 **AI-Powered Clustering** - Uses TF-IDF and k-means to group similar emails
- 📧 **Smart Email Fetching** - Retrieves last 200 emails from inbox
- 🗂️ **Visual Organization** - Clean UI showing email clusters with keywords
- 📦 **Bulk Archive** - One-click archiving of entire email groups

## Setup

### 1. Google Cloud Configuration

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Gmail API
3. Create OAuth2 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Add redirect URI: `http://localhost:3000/api/auth/callback`
4. Note down your Client ID and Client Secret

### 2. Environment Variables

Update `.env.local` with your Google credentials:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## How It Works

1. **Authentication**: OAuth2 flow with Gmail API scopes for read and modify access
2. **Email Fetching**: Retrieves last 200 emails using Gmail API
3. **Feature Extraction**: Converts email subjects and snippets to TF-IDF vectors
4. **Clustering**: K-means algorithm groups emails into 3 clusters
5. **Visualization**: Displays clusters with auto-generated names and keywords
6. **Archiving**: Removes emails from inbox by removing INBOX label

## Technology Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Gmail API** for email operations
- **Custom ML** for clustering (TF-IDF + k-means)

## API Routes

- `GET /api/auth` - Get Gmail OAuth URL
- `GET /api/auth/callback` - Handle OAuth callback
- `GET /api/emails` - Fetch and cluster emails
- `POST /api/emails/archive` - Archive selected emails
