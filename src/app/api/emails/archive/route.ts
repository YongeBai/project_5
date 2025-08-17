import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tokensStr = cookieStore.get('gmail_tokens')?.value;
    
    if (!tokensStr) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const tokens = JSON.parse(tokensStr);
    const { messageIds } = await request.json();
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Invalid message IDs' }, { status: 400 });
    }
    
    const gmailService = new GmailService();
    gmailService.setCredentials(tokens);
    
    await gmailService.archiveEmails(messageIds);
    
    return NextResponse.json({ success: true, archived: messageIds.length });
  } catch (error) {
    console.error('Error archiving emails:', error);
    return NextResponse.json({ error: 'Failed to archive emails' }, { status: 500 });
  }
}