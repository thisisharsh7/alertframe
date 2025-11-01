'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { X, Check, Bell, Mail, Clock } from 'lucide-react';
import BellLoader from './BellLoader';

interface ConfigureAlertModalProps {
  url: string;
  selectedElement: {
    selector: string;
    html: string;
    text: string;
    itemCount: number | null;
    elementType: 'single' | 'list';
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConfigureAlertModal({
  url,
  selectedElement,
  onClose,
  onSuccess,
}: ConfigureAlertModalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          cssSelector: selectedElement.selector,
          elementType: selectedElement.elementType,
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

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white border-[3px] border-black p-8">
          <div className="flex justify-center">
            <BellLoader />
          </div>
          <p className="mt-4 text-[14px] font-bold uppercase tracking-wide text-center">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full border-[3px] border-black bg-white p-8 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-black hover:text-white transition-colors border-[2px] border-black"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

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
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border-[3px] border-black max-w-2xl w-full max-h-[calc(100vh-2rem)] flex flex-col relative">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-8 pb-0 border-b-[2px] border-black relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-black hover:text-white transition-colors border-[2px] border-black bg-white z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pb-6">
            <Bell className="w-7 h-7" />
            <h1 className="text-[32px] font-black uppercase">Configure Alert</h1>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={handleCreate} className="space-y-6">

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

                {/* Coming Soon - Horizontal Overlapping Style */}
                <div className="hidden md:flex items-center justify-between py-3 opacity-60 cursor-not-allowed">
                  <div className="flex -space-x-8">
                    <span className="px-2.5 py-1 bg-white border-[2px] border-black text-[10px] font-bold uppercase">Slack</span>
                    <span className="px-2.5 py-1 bg-white border-[2px] border-black text-[10px] font-bold uppercase">Discord</span>
                    <span className="px-2.5 py-1 bg-white border-[2px] border-black text-[10px] font-bold uppercase">WhatsApp</span>
                    <span className="px-2.5 py-1 bg-white border-[2px] border-black text-[10px] font-bold uppercase">Telegram</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#FFE500] border-[2px] border-black text-[9px] font-bold uppercase">Soon</span>
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

          {/* Info Box */}
          <div className="mt-6 p-4 bg-[#FFE500] border-[3px] border-black">
            <p className="text-[13px] font-bold">
              <strong className="uppercase">What happens next?</strong> We&apos;ll check your selected element{' '}
              {frequencyLabel.toLowerCase()} and alert you when things change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
