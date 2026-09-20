'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Loading Admin Portal...</div>
      </div>
    </div>
  ),
});

export default function AdminPage() {
  return <App />;
}
