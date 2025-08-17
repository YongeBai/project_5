'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EmailCluster } from '@/components/EmailCluster';
import type { EmailCluster as EmailClusterType } from '@/lib/gmail';

export default function Home() {
  const [clusters, setClusters] = useState<EmailClusterType[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user has tokens (authenticated)
    fetchEmails();
  }, []);

  const authenticate = async () => {
    try {
      const response = await fetch('/api/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emails');
      
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.clusters) {
        setClusters(data.clusters);
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (messageIds: string[]) => {
    try {
      const response = await fetch('/api/emails/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds }),
      });

      if (response.ok) {
        // Refresh clusters after archiving
        await fetchEmails();
      } else {
        console.error('Failed to archive emails');
      }
    } catch (error) {
      console.error('Archive request failed:', error);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Email Clustering App
          </h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Automatically organize your Gmail inbox using AI-powered clustering.
            Group similar emails together and archive them with one click.
          </p>
          <Button onClick={authenticate} size="lg">
            Connect to Gmail
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Email Clusters
            </h1>
            <p className="text-gray-600 mt-2">
              Your emails organized into {clusters.length} groups
            </p>
          </div>
          <Button onClick={fetchEmails} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing your emails...</p>
          </div>
        ) : clusters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No email clusters found.</p>
            <Button onClick={fetchEmails} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clusters.map((cluster) => (
              <EmailCluster
                key={cluster.id}
                cluster={cluster}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
