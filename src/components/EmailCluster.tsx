'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { EmailCluster } from '@/lib/gmail';

interface EmailClusterProps {
  cluster: EmailCluster;
  onArchive: (messageIds: string[]) => Promise<void>;
}

export function EmailCluster({ cluster, onArchive }: EmailClusterProps) {
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const messageIds = cluster.emails.map(email => email.id);
      await onArchive(messageIds);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{cluster.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {cluster.emails.length} email{cluster.emails.length !== 1 ? 's' : ''}
          </p>
          {cluster.keywords.length > 0 && (
            <div className="flex gap-2 mt-2">
              {cluster.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={handleArchive}
          disabled={isArchiving}
          variant="outline"
          size="sm"
        >
          {isArchiving ? 'Archiving...' : 'Archive All'}
        </Button>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {cluster.emails.map((email) => (
          <div
            key={email.id}
            className="p-3 bg-gray-50 rounded border-l-4 border-l-blue-200"
          >
            <div className="font-medium text-sm text-gray-900 line-clamp-1">
              {email.subject}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              From: {email.from.split('<')[0].trim()}
            </div>
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {email.snippet}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}