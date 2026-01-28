import type { Metadata } from 'next';
import ShareViewClient from './components/share-view-client';

export const metadata: Metadata = {
  title: 'Shared Bill Split | Bufunfa',
  description: 'View shared split bill event',
  robots: 'noindex', // Prevent search indexing for privacy
};

export default function SharePage() {
  return <ShareViewClient />;
}
