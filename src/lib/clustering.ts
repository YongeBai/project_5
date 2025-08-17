import { Matrix } from 'ml-matrix';
import { removeStopwords, eng } from 'stopword';
import { WordTokenizer, PorterStemmer } from 'natural';
import type { EmailMessage, EmailCluster } from './gmail';

export class EmailClusterer {
  private tokenizer = new WordTokenizer();

  // Simple TF-IDF implementation
  private calculateTFIDF(documents: string[]): Matrix {
    // Tokenize and preprocess documents
    const tokenizedDocs = documents.map(doc => this.preprocessText(doc));
    
    // Build vocabulary
    const vocabulary = new Set<string>();
    tokenizedDocs.forEach(tokens => {
      tokens.forEach(token => vocabulary.add(token));
    });
    
    const vocabArray = Array.from(vocabulary);
    const vocabIndex = new Map(vocabArray.map((word, i) => [word, i]));
    
    // Calculate TF-IDF matrix
    const tfidfMatrix = new Matrix(documents.length, vocabArray.length);
    
    // Calculate document frequency for each term
    const df = new Map<string, number>();
    tokenizedDocs.forEach(tokens => {
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(token => {
        df.set(token, (df.get(token) || 0) + 1);
      });
    });
    
    // Fill TF-IDF matrix
    tokenizedDocs.forEach((tokens, docIndex) => {
      const termFreq = new Map<string, number>();
      tokens.forEach(token => {
        termFreq.set(token, (termFreq.get(token) || 0) + 1);
      });
      
      tokens.forEach(token => {
        const tf = (termFreq.get(token) || 0) / tokens.length;
        const idf = Math.log(documents.length / (df.get(token) || 1));
        const tfidf = tf * idf;
        
        const colIndex = vocabIndex.get(token);
        if (colIndex !== undefined) {
          tfidfMatrix.set(docIndex, colIndex, tfidf);
        }
      });
    });
    
    return tfidfMatrix;
  }

  private preprocessText(text: string): string[] {
    // Tokenize
    let tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    
    // Remove stopwords
    tokens = removeStopwords(tokens, eng);
    
    // Stem words and filter short words
    tokens = tokens
      .map(token => PorterStemmer.stem(token))
      .filter(token => token.length > 2);
    
    return tokens;
  }

  // Simple k-means clustering
  private kMeans(data: Matrix, k: number, maxIterations = 100): number[] {
    const numPoints = data.rows;
    const dimensions = data.columns;
    
    // Initialize centroids randomly
    const centroids = new Matrix(k, dimensions);
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < dimensions; j++) {
        centroids.set(i, j, Math.random());
      }
    }
    
    let assignments = new Array(numPoints).fill(0);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      const newAssignments = new Array(numPoints);
      
      // Assign points to nearest centroid
      for (let i = 0; i < numPoints; i++) {
        let minDistance = Infinity;
        let nearestCentroid = 0;
        
        for (let j = 0; j < k; j++) {
          let distance = 0;
          for (let d = 0; d < dimensions; d++) {
            const diff = data.get(i, d) - centroids.get(j, d);
            distance += diff * diff;
          }
          
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
        const clusterPoints = assignments
          .map((assignment, index) => assignment === j ? index : -1)
          .filter(index => index !== -1);
        
        if (clusterPoints.length > 0) {
          for (let d = 0; d < dimensions; d++) {
            const sum = clusterPoints.reduce((acc, pointIndex) => 
              acc + data.get(pointIndex, d), 0);
            centroids.set(j, d, sum / clusterPoints.length);
          }
        }
      }
    }
    
    return assignments;
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