import { NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';
import { EmailClusterer } from '@/lib/clustering';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokensStr = cookieStore.get('gmail_tokens')?.value;
    
    if (!tokensStr) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const tokens = JSON.parse(tokensStr);
    const gmailService = new GmailService();
    gmailService.setCredentials(tokens);
    
    // Fetch emails
    const emails = await gmailService.fetchMessages(200);
    
    // Cluster emails
    const clusterer = new EmailClusterer();
    const clusters = clusterer.clusterEmails(emails, 3);
    
    return NextResponse.json({ clusters });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}