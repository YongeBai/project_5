import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface EmailMessage {
  id: string;
  subject: string;
  snippet: string;
  from: string;
  date: string;
  labels: string[];
}

export interface EmailCluster {
  id: number;
  name: string;
  emails: EmailMessage[];
  keywords: string[];
}

export class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: ReturnType<typeof google.gmail>;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  setCredentials(tokens: object) {
    this.oauth2Client.setCredentials(tokens);
  }

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async fetchMessages(maxResults = 200): Promise<EmailMessage[]> {
    try {
      // Get message list
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'newer_than:1y in:inbox',
      });

      const messages = response.data.messages || [];
      const emailMessages: EmailMessage[] = [];

      // Fetch details for each message
      for (const message of messages) {
        try {
          const messageDetail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });

          const headers = messageDetail.data.payload?.headers || [];
          const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
          const date = headers.find((h) => h.name === 'Date')?.value || '';

          emailMessages.push({
            id: message.id,
            subject,
            snippet: messageDetail.data.snippet || '',
            from,
            date,
            labels: messageDetail.data.labelIds || [],
          });
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
        }
      }

      return emailMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async archiveEmails(messageIds: string[]): Promise<void> {
    try {
      for (const messageId of messageIds) {
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['INBOX']
          }
        });
      }
    } catch (error) {
      console.error('Error archiving emails:', error);
      throw error;
    }
  }
}