import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }
    
    const gmailService = new GmailService();
    const tokens = await gmailService.getTokens(code);
    
    // Store tokens in httpOnly cookie (in production, use proper session management)
    const cookieStore = await cookies();
    cookieStore.set('gmail_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    // Redirect to main app
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}