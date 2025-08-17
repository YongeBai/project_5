import type { EmailMessage, EmailCluster } from './gmail';

export class EmailClusterer {
  // Simplified text processing - just basic word extraction
  private preprocessText(text: string): string[] {
    // Simple tokenization - split on non-word characters
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    
    // Basic stopwords to remove
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was',
      'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
      'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'just', 'in', 'of', 'to', 'for', 'with',
      'from', 'up', 'out', 'if', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'under', 'again',
      'further', 'then', 'once', 'and', 'but', 'or', 'because', 'until',
      'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
      'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
      'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again'
    ]);
    
    // Filter stopwords and short words
    return words.filter(word => word.length > 2 && !stopwords.has(word));
  }

  // Simplified feature extraction - just word frequency vectors
  private createFeatureVectors(documents: string[]): number[][] {
    const tokenizedDocs = documents.map(doc => this.preprocessText(doc));
    
    // Build vocabulary from most common words (limit for performance)
    const wordCounts = new Map<string, number>();
    tokenizedDocs.forEach(tokens => {
      tokens.forEach(token => {
        wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
      });
    });
    
    // Take top 100 most common words as features
    const vocabulary = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([word]) => word);
    
    const vocabIndex = new Map(vocabulary.map((word, i) => [word, i]));
    
    // Create simple frequency vectors
    return tokenizedDocs.map(tokens => {
      const vector = new Array(vocabulary.length).fill(0);
      tokens.forEach(token => {
        const index = vocabIndex.get(token);
        if (index !== undefined) {
          vector[index]++;
        }
      });
      // Normalize by document length
      const sum = vector.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        return vector.map(v => v / sum);
      }
      return vector;
    });
  }

  // Simple k-means clustering with k-means++ initialization
  private kMeans(data: number[][], k: number, maxIterations = 30): number[] {
    const numPoints = data.length;
    if (numPoints === 0 || k === 0) return [];
    
    const dimensions = data[0].length;
    
    // K-means++ initialization for better starting centroids
    const centroids: number[][] = [];
    
    // Choose first centroid randomly
    const firstIdx = Math.floor(Math.random() * numPoints);
    centroids.push([...data[firstIdx]]);
    
    // Choose remaining centroids using k-means++
    for (let c = 1; c < k; c++) {
      const distances = data.map(point => {
        let minDist = Infinity;
        centroids.forEach(centroid => {
          const dist = this.euclideanDistance(point, centroid);
          if (dist < minDist) minDist = dist;
        });
        return minDist;
      });
      
      // Pick next centroid with probability proportional to squared distance
      const totalDist = distances.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalDist;
      let cumulative = 0;
      let selectedIdx = 0;
      
      for (let i = 0; i < distances.length; i++) {
        cumulative += distances[i];
        if (cumulative >= random) {
          selectedIdx = i;
          break;
        }
      }
      
      centroids.push([...data[selectedIdx]]);
    }
    
    let assignments = new Array(numPoints).fill(0);
    
    // Main k-means loop
    for (let iter = 0; iter < maxIterations; iter++) {
      const newAssignments = new Array(numPoints);
      
      // Assign points to nearest centroid
      for (let i = 0; i < numPoints; i++) {
        let minDistance = Infinity;
        let nearestCentroid = 0;
        
        for (let j = 0; j < k; j++) {
          const distance = this.euclideanDistance(data[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = j;
          }
        }
        
        newAssignments[i] = nearestCentroid;
      }
      
      // Check for convergence
      if (newAssignments.every((val, idx) => val === assignments[idx])) {
        break;
      }
      
      assignments = newAssignments;
      
      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints: number[][] = [];
        assignments.forEach((assignment, idx) => {
          if (assignment === j) {
            clusterPoints.push(data[idx]);
          }
        });
        
        if (clusterPoints.length > 0) {
          // Calculate new centroid as mean of cluster points
          for (let d = 0; d < dimensions; d++) {
            const sum = clusterPoints.reduce((acc, point) => acc + point[d], 0);
            centroids[j][d] = sum / clusterPoints.length;
          }
        }
      }
    }
    
    // Ensure we have at least 3 non-empty clusters by redistributing if needed
    const clusterCounts = new Array(k).fill(0);
    assignments.forEach(a => clusterCounts[a]++);
    
    // Count non-empty clusters
    const nonEmptyCount = clusterCounts.filter(c => c > 0).length;
    
    // If we have less than 3 non-empty clusters, redistribute
    if (nonEmptyCount < Math.min(3, k) && numPoints >= 3) {
      // Find empty clusters
      const emptyClusters: number[] = [];
      const nonEmptyClusters: number[] = [];
      
      clusterCounts.forEach((count, idx) => {
        if (count === 0) emptyClusters.push(idx);
        else nonEmptyClusters.push(idx);
      });
      
      // Redistribute from largest clusters to empty ones
      emptyClusters.forEach(emptyIdx => {
        if (nonEmptyClusters.length > 0) {
          // Find largest cluster
          let largestIdx = nonEmptyClusters[0];
          let largestCount = clusterCounts[largestIdx];
          
          nonEmptyClusters.forEach(idx => {
            if (clusterCounts[idx] > largestCount) {
              largestIdx = idx;
              largestCount = clusterCounts[idx];
            }
          });
          
          // Move some points from largest to empty
          if (largestCount > 1) {
            let moved = 0;
            const targetMoves = Math.max(1, Math.floor(largestCount / 3));
            
            for (let i = 0; i < assignments.length && moved < targetMoves; i++) {
              if (assignments[i] === largestIdx) {
                assignments[i] = emptyIdx;
                moved++;
                clusterCounts[largestIdx]--;
                clusterCounts[emptyIdx]++;
              }
            }
          }
        }
      });
    }
    
    return assignments;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  private extractKeywords(emails: EmailMessage[], topN = 3): string[] {
    const allText = emails.map(email => `${email.subject} ${email.snippet}`).join(' ');
    const tokens = this.preprocessText(allText);
    
    // Count frequency
    const freq = new Map<string, number>();
    tokens.forEach(token => {
      freq.set(token, (freq.get(token) || 0) + 1);
    });
    
    // Get top keywords
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word]) => word);
  }

  private generateClusterName(emails: EmailMessage[], keywords: string[]): string {
    // Try to generate meaningful names based on content
    if (keywords.length > 0) {
      return keywords.slice(0, 2).map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' & ');
    }
    
    // Fallback to sender-based naming
    const senders = emails.map(e => e.from.split('@')[0].split('<')[0].trim());
    const uniqueSenders = [...new Set(senders)];
    
    if (uniqueSenders.length === 1) {
      return `${uniqueSenders[0]} Messages`;
    } else if (uniqueSenders.length <= 3) {
      return `${uniqueSenders.slice(0, 2).join(', ')} Messages`;
    }
    
    return `Mixed Messages`;
  }

  clusterEmails(emails: EmailMessage[], numClusters = 3): EmailCluster[] {
    if (emails.length === 0) return [];
    
    // Create feature vectors from subject + snippet
    const documents = emails.map(email => `${email.subject} ${email.snippet}`);
    const tfidfMatrix = this.calculateTFIDF(documents);
    
    // Perform clustering
    const assignments = this.kMeans(tfidfMatrix, Math.min(numClusters, emails.length));
    
    // Group emails by cluster
    const clusters: EmailCluster[] = [];
    
    for (let i = 0; i < numClusters; i++) {
      const clusterEmails = emails.filter((_, index) => assignments[index] === i);
      
      if (clusterEmails.length > 0) {
        const keywords = this.extractKeywords(clusterEmails);
        const name = this.generateClusterName(clusterEmails, keywords);
        
        clusters.push({
          id: i,
          name,
          emails: clusterEmails,
          keywords
        });
      }
    }
    
    return clusters.sort((a, b) => b.emails.length - a.emails.length);
  }
}