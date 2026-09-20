import type { Metadata } from 'next';
import './globals.css';
import React from 'react';

export const metadata: Metadata = {
  title: 'RIDEX — Premium Riding Gear & Touring Equipment',
  description:
    'Production-grade e-commerce platform for premium motorcycle riding gear, rain protection suits, and touring luggage with complete store & inventory management.',
  openGraph: {
    title: 'RIDEX — Premium Riding Gear & Touring Equipment',
    description:
      'Production-grade e-commerce platform for premium motorcycle riding gear, rain protection suits, and touring luggage with complete store & inventory management.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
