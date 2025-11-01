'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BellLoader from '@/components/BellLoader';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [kernelApiKey, setKernelApiKey] = useState<string>('');
  const [hasKernelKey, setHasKernelKey] = useState<boolean>(false);
  const [kernelError, setKernelError] = useState<string>('');
  const [kernelSuccess, setKernelSuccess] = useState<string>('');
  const [isSavingKernel, setIsSavingKernel] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check if user has OnKernel API key
      fetch('/api/kernel/save')
        .then(res => res.json())
        .then(data => {
          if (data.hasKey) {
            setHasKernelKey(true);
          }
        })
        .catch(err => console.error('Error checking OnKernel key:', err));

      setLoading(false);
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.mobile-menu') && !target.closest('.hamburger-btn')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSaveKernelKey = async () => {
    if (!kernelApiKey.trim()) {
      setKernelError('Please enter your Kernel API key');
      return;
    }

    if (!kernelApiKey.startsWith('sk_')) {
      setKernelError('Invalid Kernel API key format. Keys should start with "sk_"');
      return;
    }

    setIsSavingKernel(true);
    setKernelError('');
    setKernelSuccess('');

    try {
      const response = await fetch('/api/kernel/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: kernelApiKey }),
      });

      if (response.ok) {
        setHasKernelKey(true);
        setKernelApiKey('');
        setKernelSuccess('Kernel API key saved successfully!');
        setTimeout(() => setKernelSuccess(''), 5000);
      } else {
        const data = await response.json();
        setKernelError(data.error || 'Failed to save API key');
        setTimeout(() => setKernelError(''), 10000);
      }
    } catch (error) {
      console.error('Error saving OnKernel key:', error);
      setKernelError('Failed to save API key. Please try again.');
      setTimeout(() => setKernelError(''), 10000);
    } finally {
      setIsSavingKernel(false);
    }
  };

  const handleDeleteKernelKey = async () => {
    setKernelError('');
    setKernelSuccess('');

    try {
      const response = await fetch('/api/kernel/save', {
        method: 'DELETE',
      });

      if (response.ok) {
        setHasKernelKey(false);
        setKernelSuccess('Kernel API key deleted successfully');
        setTimeout(() => setKernelSuccess(''), 5000);
      } else {
        const data = await response.json();
        setKernelError(data.error || 'Failed to delete API key');
        setTimeout(() => setKernelError(''), 10000);
      }
    } catch (error) {
      console.error('Error deleting OnKernel key:', error);
      setKernelError('Failed to delete API key. Please try again.');
      setTimeout(() => setKernelError(''), 10000);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Account deleted successfully, sign out and redirect
        await signOut({ callbackUrl: '/', redirect: true });
      } else {
        const data = await response.json();
        alert(`Failed to delete account: ${data.error || 'Unknown error'}`);
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
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

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="max-w-md w-full border-[3px] border-black bg-white p-8">
          <h1 className="text-[32px] font-black uppercase tracking-tight mb-4">Sign In Required</h1>
          <p className="text-[16px] font-medium mb-6 leading-relaxed">
            You need to sign in to access settings.
          </p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/settings' })}
            className="w-full bg-black text-white py-3 px-4 text-[14px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#FFE500] hover:text-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="border-b-[3px] border-black bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-1.5 group cursor-pointer" onClick={() => router.push('/')}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[28px] sm:h-[28px] transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
                <path d="M14 4C11 4 9 6 9 9V13L7 17H21L19 13V9C19 6 17 4 14 4Z" fill="#FFE500" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M12 17V18C12 19.1 12.9 20 14 20C15.1 20 16 19.1 16 18V17" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="19" cy="7.5" r="3" fill="#FF3366" stroke="#000000" strokeWidth="2" />
              </svg>
              <span className="text-[18px] sm:text-[21px] font-black tracking-tight uppercase leading-none">AlertFrame</span>
            </div>

            <div className="relative">
              {/* Desktop: Dashboard Button */}
              <button
                onClick={() => router.push('/dashboard')}
                className="hidden md:block px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[13px] font-bold uppercase tracking-wide border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
              >
                Dashboard
              </button>

              {/* Mobile: Hamburger Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hamburger-btn md:hidden px-3 py-2 border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  // Close icon (X)
                  <svg className="w-5 h-5" fill="none" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  // Hamburger icon
                  <svg className="w-5 h-5" fill="none" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* Mobile Menu Dropdown */}
              {isMenuOpen && (
                <div className="mobile-menu absolute right-0 top-full mt-2 w-48 border-[3px] border-black bg-white shadow-[4px_4px_0_0_#000] md:hidden">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push('/dashboard');
                    }}
                    className="w-full px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-left border-b-[3px] border-black hover:bg-black hover:text-white transition-all"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="w-full px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-left hover:bg-[#FF3366] hover:text-white transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        <h1 className="text-[36px] sm:text-[42px] md:text-[48px] font-black uppercase tracking-tight mb-6 sm:mb-8">Settings</h1>

        {/* OnKernel API Key Section */}
        <section className="border-[3px] border-black bg-white p-5 sm:p-6 mb-5 sm:mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] bg-[#06B6D4] opacity-20"></div>
          <h2 className="text-[20px] sm:text-[24px] font-black uppercase mb-2 tracking-tight relative z-10">Kernel API Key</h2>
          <p className="text-[13px] sm:text-[14px] font-medium mb-5 sm:mb-6 leading-relaxed opacity-80 relative z-10">
            Add your own Kernel API key to power browser automation. Each user pays for their own usage with Kernel&apos;s free tier ($5/month credits).
          </p>

          {/* Error Message */}
          {kernelError && (
            <div className="border-[3px] border-[#FF3366] bg-[#FFE5E5] p-4 mb-4 relative z-10">
              <p className="text-[13px] font-bold text-[#FF3366] uppercase tracking-wide mb-1">
                Error
              </p>
              <p className="text-[14px] font-medium">{kernelError}</p>
            </div>
          )}

          {/* Success Message */}
          {kernelSuccess && (
            <div className="border-[3px] border-[#06B6D4] bg-[#E0F2FE] p-4 mb-4 relative z-10">
              <p className="text-[13px] font-bold text-cyan-800 uppercase tracking-wide mb-1">
                Success
              </p>
              <p className="text-[14px] font-medium text-cyan-900">{kernelSuccess}</p>
            </div>
          )}

          <div className="border-[3px] border-black p-4 bg-[#FAFAFA] relative z-10">
            {hasKernelKey ? (
              <div className="space-y-4">
                {/* Connected Status */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#06B6D4] border-[3px] border-black flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="#000000"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-black uppercase tracking-wide">API Key Configured</p>
                      <p className="text-[13px] font-medium opacity-70">Your Kernel API key is saved and encrypted</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteKernelKey}
                    className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide border-[3px] border-[#FF3366] text-[#FF3366] bg-white hover:bg-[#FF3366] hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] flex-shrink-0"
                  >
                    Remove Key
                  </button>
                </div>

                {/* Benefits */}
                <div className="border-[3px] border-black bg-white p-4">
                  <p className="text-[12px] font-black uppercase tracking-wide mb-3">You&apos;re all set:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="text-[#06B6D4] font-black flex-shrink-0">✓</span>
                      <span>Browser automation powered by your API key</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="text-[#06B6D4] font-black flex-shrink-0">✓</span>
                      <span>$5/month free credits from Kernel</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="text-[#06B6D4] font-black flex-shrink-0">✓</span>
                      <span>10x faster than serverless Chromium</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="text-[#06B6D4] font-black flex-shrink-0">✓</span>
                      <span>You control your own usage and costs</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Not Connected Status */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="#000000"
                    >
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-black uppercase tracking-wide mb-2">No API Key Yet</p>
                    <p className="text-[13px] font-medium mb-4 leading-relaxed opacity-80">
                      Add your Kernel API key to enable browser automation. Get your free API key with $5/month credits!
                    </p>

                    {/* API Key Input */}
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={kernelApiKey}
                        onChange={(e) => setKernelApiKey(e.target.value)}
                        placeholder="sk_..."
                        className="w-full px-4 py-3 border-[3px] border-black text-[14px] font-medium focus:outline-none focus:ring-0"
                      />
                      <button
                        onClick={handleSaveKernelKey}
                        disabled={isSavingKernel}
                        className="bg-black text-white py-2 px-6 text-[13px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#06B6D4] hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingKernel ? 'Saving...' : 'Save API Key'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Why Add Key */}
                <div className="border-t-[3px] border-black pt-4">
                  <p className="text-[12px] font-black uppercase tracking-wide mb-3">Why add your own key?</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>Free tier: $5/month credits (~$0.06/hour usage)</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>10x faster than serverless Chromium</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>No cold starts or timeout issues</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>You control your own usage limits</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>Your key is encrypted and stored securely</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 border-[3px] border-black bg-[#06B6D4] p-4 relative z-10">
            <p className="text-[13px] font-medium leading-relaxed">
              <strong className="font-black uppercase text-[12px] tracking-wide">Get Your API Key:</strong> Sign up at{' '}
              <a
                href="https://dashboard.onkernel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black underline hover:no-underline"
              >
                dashboard.onkernel.com
              </a>
              {' '}to get your free API key. Your key is encrypted before storage and never shared.
            </p>
          </div>
        </section>

        {/* Delete Account Section */}
        <section className="border-[3px] border-[#FF3366] bg-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] bg-[#FF3366] opacity-10"></div>
          <h2 className="text-[20px] sm:text-[24px] font-black uppercase mb-2 tracking-tight text-[#FF3366] relative z-10">Delete Account</h2>
          <p className="text-[13px] sm:text-[14px] font-medium mb-5 sm:mb-6 leading-relaxed opacity-80 relative z-10">
            Once you delete your account, there is no going back. All your alerts, changes, and data will be permanently deleted.
          </p>

          <div className="border-[3px] border-[#FF3366] bg-[#FFF5F7] p-4 mb-4 relative z-10">
            <p className="text-[12px] font-black uppercase tracking-wide mb-3 text-[#FF3366]">⚠️ This will delete:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-[13px] font-medium">
                <span className="text-[#FF3366] font-black flex-shrink-0">•</span>
                <span>All alerts and monitoring configurations</span>
              </li>
              <li className="flex items-start gap-2 text-[13px] font-medium">
                <span className="text-[#FF3366] font-black flex-shrink-0">•</span>
                <span>All change history and snapshots</span>
              </li>
              <li className="flex items-start gap-2 text-[13px] font-medium">
                <span className="text-[#FF3366] font-black flex-shrink-0">•</span>
                <span>Your account information</span>
              </li>
              <li className="flex items-start gap-2 text-[13px] font-medium">
                <span className="text-[#FF3366] font-black flex-shrink-0">•</span>
                <span>All stored settings and data</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 text-[13px] font-bold uppercase tracking-wide border-[3px] border-[#FF3366] text-[#FF3366] bg-white hover:bg-[#FF3366] hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] relative z-10"
          >
            Delete My Account
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-black mt-auto py-2.5 sm:py-3 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide opacity-60">
            © 2025 AlertFrame
          </p>
        </div>
      </footer>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[4px] border-[#FF3366] max-w-md w-full p-5 sm:p-6 relative">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#FF3366] border-[3px] border-black flex items-center justify-center">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="#FFFFFF"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[24px] font-black uppercase tracking-tight text-center mb-4 text-[#FF3366]">
              Delete Account?
            </h2>

            {/* Warning Text */}
            <div className="border-[3px] border-[#FF3366] bg-[#FFF5F7] p-4 mb-6">
              <p className="text-[14px] font-bold uppercase tracking-wide mb-2 text-[#FF3366]">
                ⚠️ Warning: This action cannot be undone!
              </p>
              <p className="text-[13px] font-medium leading-relaxed mb-2">
                All of your data will be <strong className="font-black">permanently deleted</strong>, including:
              </p>
              <ul className="space-y-1 text-[13px] font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-[#FF3366] font-black flex-shrink-0">•</span>
                  <span>All alerts and monitoring configurations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF3366] font-black flex-shrink-0">•</span>
                  <span>All change history and snapshots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF3366] font-black flex-shrink-0">•</span>
                  <span>Your account information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF3366] font-black flex-shrink-0">•</span>
                  <span>Gmail connection and settings</span>
                </li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                No, Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-[13px] font-bold uppercase tracking-wide border-[3px] border-[#FF3366] bg-[#FF3366] text-white hover:bg-white hover:text-[#FF3366] transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
