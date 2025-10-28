'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { ArrowLeft, Check, Bell, Mail, Clock } from 'lucide-react';
import BellLoader from '@/components/BellLoader';

function ConfigureContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const url = searchParams.get('url') || '';
  const selector = searchParams.get('selector') || '';
  const elementType = searchParams.get('elementType') || 'single';
  const itemCount = parseInt(searchParams.get('itemCount') || '0');

  const [title, setTitle] = useState('');
  const [frequencyMinutes, setFrequencyMinutes] = useState(600);
  const [frequencyLabel, setFrequencyLabel] = useState('Every 10 hours');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [isCreating, setIsCreating] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Update email when session changes (after sign-in)
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          cssSelector: selector,
          elementType,
          title: title || `Monitor ${new URL(url).hostname}`,
          frequencyMinutes,
          frequencyLabel,
          notifyEmail: true,
          email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard?created=${data.id}`);
      } else {
        alert('Failed to create alert. Please try again.');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center">
            <BellLoader />
          </div>
          <p className="mt-4 text-[14px] font-bold uppercase tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="max-w-md w-full border-[3px] border-black bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-10 h-10" />
            <h1 className="text-[32px] font-black uppercase tracking-tight">Sign In Required</h1>
          </div>
          <p className="text-[16px] font-medium mb-6 leading-relaxed">
            You need to sign in to create alerts and monitor website changes.
          </p>
          <button
            onClick={() => {
              setIsSigningIn(true);
              setTimeout(() => {
                signIn('google', { callbackUrl: window.location.href }).catch(() => setIsSigningIn(false));
              }, 0);
            }}
            disabled={isSigningIn}
            className="w-full bg-black text-white py-3 px-4 text-[14px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#FFE500] hover:text-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full mt-3 bg-white text-black py-3 px-4 text-[14px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b-[3px] border-black">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/selector?url=${encodeURIComponent(url)}`)}
                className="flex items-center gap-1.5 px-3 py-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition-colors text-[12px] font-bold uppercase"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="h-5 w-[2px] bg-black" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-60">Configure Alert</p>
                <p className="font-bold text-[12px] truncate max-w-md" title={url}>
                  {url}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white border-[3px] border-black p-8">
          <div className="flex items-center gap-3 mb-8">
            <Bell className="w-7 h-7" />
            <h1 className="text-[32px] font-black uppercase">Configure Alert</h1>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Selection Summary */}
            <div className="p-4 bg-[#F5F5F5] border-[2px] border-black">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide opacity-60 mb-1">
                    Selected Element
                  </p>
                  <code className="text-[12px] font-mono font-medium">
                    {selector}
                  </code>
                </div>
                {elementType === 'list' && (
                  <span className="px-3 py-1.5 bg-[#06B6D4] text-white border-[2px] border-black text-[11px] font-bold uppercase">
                    {itemCount} items
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide opacity-60 mb-2">
                Alert Name (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., YC Fall 2025 Companies"
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:outline-none focus:shadow-[4px_4px_0_0_#000] transition-shadow text-[14px] font-medium"
              />
            </div>

            {/* Check Frequency */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-60 mb-2">
                <Clock className="w-4 h-4" />
                Check Frequency
              </label>
              <select
                value={frequencyMinutes}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFrequencyMinutes(value);
                  // Set label based on selected option
                  const selectedOption = e.target.options[e.target.selectedIndex];
                  setFrequencyLabel(selectedOption.text);
                }}
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:outline-none focus:shadow-[4px_4px_0_0_#000] transition-shadow text-[14px] font-bold uppercase cursor-pointer hover:bg-[#F5F5F5] appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23000000' stroke-width='2' stroke-linecap='square'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '3rem'
                }}
              >
                <option value="60">Every hour</option>
                <option value="360">Every 6 hours</option>
                <option value="600">Every 10 hours</option>
                <option value="1440">Daily</option>
                <option value="10080">Weekly</option>
              </select>
              <p className="mt-2 text-[11px] font-bold opacity-60">
                How often should we check for changes?
              </p>
            </div>

            {/* Notification Settings */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-60 mb-3">
                <Mail className="w-4 h-4" />
                Notification Settings
              </label>
              <div className="space-y-2">
                {/* Email - Always enabled */}
                <label className="flex items-center gap-3 p-3 border-[2px] border-black bg-[#F5F5F5]">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-5 h-5 accent-black cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-[13px] uppercase">Email Notifications</p>
                    <p className="text-[11px] font-bold opacity-60">
                      Get notified via email when changes are detected
                    </p>
                  </div>
                </label>

                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-3 border-[3px] border-black bg-gray-100 cursor-not-allowed text-[14px] font-medium"
                />

                {/* Slack - Coming Soon */}
                <div className="relative opacity-60 cursor-not-allowed">
                  <label className="flex items-center gap-2 p-2 border-[2px] border-black bg-[#F5F5F5]">
                    <input type="checkbox" disabled className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-bold text-[11px] uppercase">Slack</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#FFE500] border-[2px] border-black text-[9px] font-bold uppercase">Soon</span>
                  </label>
                </div>

                {/* Discord - Coming Soon */}
                <div className="relative opacity-60 cursor-not-allowed">
                  <label className="flex items-center gap-2 p-2 border-[2px] border-black bg-[#F5F5F5]">
                    <input type="checkbox" disabled className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-bold text-[11px] uppercase">Discord</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#FFE500] border-[2px] border-black text-[9px] font-bold uppercase">Soon</span>
                  </label>
                </div>

                {/* WhatsApp - Coming Soon */}
                <div className="relative opacity-60 cursor-not-allowed">
                  <label className="flex items-center gap-2 p-2 border-[2px] border-black bg-[#F5F5F5]">
                    <input type="checkbox" disabled className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-bold text-[11px] uppercase">WhatsApp</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#FFE500] border-[2px] border-black text-[9px] font-bold uppercase">Soon</span>
                  </label>
                </div>

                {/* Telegram - Coming Soon */}
                <div className="relative opacity-60 cursor-not-allowed">
                  <label className="flex items-center gap-2 p-2 border-[2px] border-black bg-[#F5F5F5]">
                    <input type="checkbox" disabled className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-bold text-[11px] uppercase">Telegram</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#FFE500] border-[2px] border-black text-[9px] font-bold uppercase">Soon</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t-[2px] border-black">
              <button
                type="submit"
                disabled={isCreating || !email}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-bold uppercase text-[14px] border-[3px] border-black hover:bg-[#FFE500] hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-[3px] border-white border-t-transparent animate-spin rounded-full"></div>
                    Creating Alert...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Create Alert
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-[#FFE500] border-[3px] border-black">
          <p className="text-[13px] font-bold">
            <strong className="uppercase">What happens next?</strong> We&apos;ll check your selected element{' '}
            {frequencyLabel.toLowerCase()} and alert you when things change.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <BellLoader />
      </div>
    }>
      <ConfigureContent />
    </Suspense>
  );
}
