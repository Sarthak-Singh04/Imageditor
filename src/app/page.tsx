'use client';

import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';

// Import ImageEditor with no SSR
const ImageEditor = dynamic(() => import('@/components/ImageEditor'), { 
  ssr: false,
  loading: () => <div>Loading editor...</div>
});

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center dark:text-white">
          Image Inpainting Editor
        </h1>
        <ImageEditor />
        <Toaster position="bottom-right" />
      </div>
    </main>
  );
}
