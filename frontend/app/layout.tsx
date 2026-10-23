import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';

export const metadata: Metadata = {
  title: 'PromptFence — Application Security Testing & Defense Platform',
  description: 'Defensive cybersecurity testing platform evaluating chatbot targets against prompt injection and sensitive data disclosure.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col md:flex-row antialiased">
        <Sidebar />
        <main className="flex-1 min-w-0 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full transition-all">
          {children}
        </main>
      </body>
    </html>
  );
}
