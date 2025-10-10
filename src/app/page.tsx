'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Reset signing in state when page becomes visible (catches browser back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSigningIn) {
        setIsSigningIn(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSigningIn]);

  // Add timeout fallback - reset after 10 seconds if OAuth doesn't complete
  useEffect(() => {
    if (isSigningIn) {
      const timeout = setTimeout(() => {
        setIsSigningIn(false);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isSigningIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    const encodedUrl = encodeURIComponent(url);
    router.push(`/selector?url=${encodedUrl}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden flex flex-col">

      {/* Header */}
      <header className="border-b-[3px] border-black bg-white relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-1.5 group cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[28px] sm:h-[28px] transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
                <path d="M14 4C11 4 9 6 9 9V13L7 17H21L19 13V9C19 6 17 4 14 4Z" fill="#FFE500" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M12 17V18C12 19.1 12.9 20 14 20C15.1 20 16 19.1 16 18V17" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="19" cy="7.5" r="3" fill="#FF3366" stroke="#000000" strokeWidth="2"/>
              </svg>
              <span className="text-[17px] sm:text-[21px] font-black tracking-tight uppercase leading-none">AlertFrame</span>
            </div>
            {session ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[13px] font-bold uppercase tracking-wide border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSigningIn(true);
                  setTimeout(() => {
                    signIn('google', { callbackUrl: '/dashboard' }).catch(() => setIsSigningIn(false));
                  }, 0);
                }}
                disabled={isSigningIn}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[13px] font-bold uppercase tracking-wide border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? 'Signing In...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 relative z-10 flex-1">
        <div className="max-w-[900px] mx-auto relative">
          {/* Background Illustration - Browser Window Mockup */}
          <div className="absolute right-[-80px] top-[80px] opacity-[0.12] pointer-events-none hidden xl:block">
            <svg width="380" height="280" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Browser Window */}
              <rect x="10" y="10" width="380" height="280" fill="#FFFFFF" stroke="#000000" strokeWidth="4"/>
              <rect x="10" y="10" width="380" height="40" fill="#F0F0F0" stroke="#000000" strokeWidth="4"/>
              <circle cx="30" cy="30" r="6" fill="#FF3366" stroke="#000000" strokeWidth="2"/>
              <circle cx="50" cy="30" r="6" fill="#FFE500" stroke="#000000" strokeWidth="2"/>
              <circle cx="70" cy="30" r="6" fill="#00FF00" stroke="#000000" strokeWidth="2"/>

              {/* Content Lines */}
              <rect x="30" y="70" width="200" height="15" fill="#000000" opacity="0.1"/>
              <rect x="30" y="95" width="160" height="15" fill="#000000" opacity="0.1"/>
              <rect x="30" y="120" width="180" height="15" fill="#000000" opacity="0.1"/>

              {/* Highlighted Section with Alert */}
              <rect x="30" y="155" width="340" height="60" fill="#FFE500" opacity="0.3" stroke="#000000" strokeWidth="3" strokeDasharray="8 4"/>
              <path d="M360 170 L375 185 L360 200" stroke="#000000" strokeWidth="3" fill="none"/>

              {/* Bell Notification */}
              <g transform="translate(300, 60)">
                <path d="M20 10C17 10 15 12 15 15V19L13 23H27L25 19V15C25 12 23 10 20 10Z" fill="#FFE500" stroke="#000000" strokeWidth="2.5"/>
                <circle cx="25" cy="13" r="4" fill="#FF3366" stroke="#000000" strokeWidth="2"/>
              </g>
            </svg>
          </div>

          {/* Main Heading */}
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-[48px] sm:text-[56px] md:text-[64px] lg:text-[72px] leading-[1.1] font-black tracking-tight mb-4 sm:mb-6 uppercase">
              Never Miss
              <span className="block mt-2">A Change</span>
              <span className="block mt-2 relative inline-block">
                <span className="relative z-10">On Any Website</span>
                <span className="absolute bottom-1 sm:bottom-2 left-0 w-full h-[12px] sm:h-[16px] md:h-[20px] bg-[#FFE500] -z-10"></span>
              </span>
            </h1>
            <p className="text-[17px] sm:text-[19px] md:text-[21px] leading-[1.6] font-medium max-w-[640px]">
              Track what matters on any website. Get instant alerts when things change.
            </p>
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="mb-16">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/page-to-monitor"
                  className="w-full px-5 py-4 text-[15px] font-medium border-[3px] border-black bg-white focus:outline-none focus:shadow-[6px_6px_0_0_#000] transition-shadow"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !url}
                className="px-8 py-4 bg-black text-white text-[15px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#FFE500] hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] whitespace-nowrap"
              >
                {isLoading ? 'Loading...' : 'Start Monitoring'}
              </button>
            </div>
          </form>

          {/* Example URLs */}
          <div className="mb-16 sm:mb-20 md:mb-24">
            <div className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wide mb-3 sm:mb-4 opacity-60">
              Try Examples:
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setUrl('https://www.ycombinator.com/companies?batch=Fall%202025')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-bold border-[2px] border-black bg-white hover:bg-[#00FF00] transition-colors duration-200"
              >
                YC Companies
              </button>
              <button
                onClick={() => setUrl('https://news.ycombinator.com/')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-bold border-[2px] border-black bg-white hover:bg-[#00FF00] transition-colors duration-200"
              >
                Hacker News
              </button>
              <button
                onClick={() => setUrl('https://github.com/trending')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-bold border-[2px] border-black bg-white hover:bg-[#00FF00] transition-colors duration-200"
              >
                GitHub Trending
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="border-[3px] border-black bg-white p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] bg-[#FFE500] opacity-40"></div>
              <svg className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] mb-4 sm:mb-6 relative z-10" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="24" stroke="#000000" strokeWidth="3"/>
                <circle cx="28" cy="28" r="10" fill="#000000"/>
              </svg>
              <h3 className="text-[18px] sm:text-[20px] font-black uppercase mb-2 sm:mb-3 leading-tight">Visual Selection</h3>
              <p className="text-[15px] sm:text-[16px] leading-[1.6] font-medium opacity-80">
                Click what you want to track. Simple as that.
              </p>
            </div>

            <div className="border-[3px] border-black bg-white p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] bg-[#00FF00] opacity-40"></div>
              <svg className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] mb-4 sm:mb-6 relative z-10" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 28L22 40L46 16" stroke="#000000" strokeWidth="4" strokeLinecap="square"/>
              </svg>
              <h3 className="text-[18px] sm:text-[20px] font-black uppercase mb-2 sm:mb-3 leading-tight">Smart Detection</h3>
              <p className="text-[15px] sm:text-[16px] leading-[1.6] font-medium opacity-80">
                Automatically detects lists, counts items, and identifies changes.
              </p>
            </div>

            <div className="border-[3px] border-black bg-white p-6 sm:p-8 relative overflow-hidden sm:col-span-2 md:col-span-1">
              <div className="absolute top-0 right-0 w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] bg-[#FF3366] opacity-40"></div>
              <svg className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] mb-4 sm:mb-6 relative z-10" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="22" stroke="#000000" strokeWidth="3"/>
                <path d="M28 14L28 28L38 38" stroke="#000000" strokeWidth="3" strokeLinecap="square"/>
              </svg>
              <h3 className="text-[18px] sm:text-[20px] font-black uppercase mb-2 sm:mb-3 leading-tight">Flexible Schedule</h3>
              <p className="text-[15px] sm:text-[16px] leading-[1.6] font-medium opacity-80">
                Check every hour, day, or custom interval. You decide.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-black mt-auto py-2.5 sm:py-3 bg-white relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide opacity-60">
            © 2025 AlertFrame
          </p>
        </div>
      </footer>
    </div>
  );
}
