'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BellLoader from '@/components/BellLoader';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [gmailStatus, setGmailStatus] = useState<{
    connected: boolean;
    email: string | null;
  }>({ connected: false, email: null });
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [gmailError, setGmailError] = useState<string>('');
  const [gmailSuccess, setGmailSuccess] = useState<string>('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check Gmail connection status
      const user = session.user as { gmailConnected?: boolean; gmailEmail?: string };
      setGmailStatus({
        connected: user.gmailConnected || false,
        email: user.gmailEmail || null,
      });
      setLoading(false);
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  const handleConnectGmail = () => {
    if (isSigningIn) {
      console.warn('[Settings] Gmail connection already in progress');
      return;
    }

    setIsSigningIn(true);
    setGmailError('');
    setGmailSuccess('');

    setTimeout(() => {
      signIn('google', { callbackUrl: '/settings' }).catch((err) => {
        console.error('[Settings] Error connecting Gmail:', err);
        setIsSigningIn(false);

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setGmailError(
          `Failed to connect Gmail: ${errorMessage}. Please check your internet connection and try again.`
        );

        // Auto-clear error after 10 seconds
        setTimeout(() => setGmailError(''), 10000);
      });
    }, 0);
  };

  const handleDisconnectGmail = async () => {
    setGmailError('');
    setGmailSuccess('');

    try {
      const response = await fetch('/api/gmail/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setGmailStatus({ connected: false, email: null });
        setGmailSuccess('Gmail disconnected successfully');

        // Auto-clear success message after 5 seconds
        setTimeout(() => setGmailSuccess(''), 5000);
      } else {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.error || data.message || 'Failed to disconnect Gmail';
        setGmailError(errorMsg);

        // Auto-clear error after 10 seconds
        setTimeout(() => setGmailError(''), 10000);
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setGmailError(`Failed to disconnect Gmail: ${errorMessage}. Please try again.`);

      // Auto-clear error after 10 seconds
      setTimeout(() => setGmailError(''), 10000);
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
            onClick={handleConnectGmail}
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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="border-b-[3px] border-black bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => router.push('/')}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
                <path d="M14 4C11 4 9 6 9 9V13L7 17H21L19 13V9C19 6 17 4 14 4Z" fill="#FFE500" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M12 17V18C12 19.1 12.9 20 14 20C15.1 20 16 19.1 16 18V17" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="19" cy="7.5" r="3" fill="#FF3366" stroke="#000000" strokeWidth="2"/>
              </svg>
              <span className="text-[21px] font-black tracking-tight uppercase leading-none">AlertFrame</span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-[13px] font-bold uppercase tracking-wide border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[900px] mx-auto px-6 py-12 flex-1">
        <h1 className="text-[48px] font-black uppercase tracking-tight mb-8">Settings</h1>

        {/* Account Section */}
        <section className="border-[3px] border-black bg-white p-6 mb-6">
          <h2 className="text-[24px] font-black uppercase mb-4 tracking-tight">Account</h2>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide opacity-60 mb-1">Email</p>
              <p className="text-[16px] font-bold">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 text-[13px] font-bold uppercase tracking-wide border-[3px] border-[#FF3366] text-[#FF3366] bg-white hover:bg-[#FF3366] hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
            >
              Sign Out
            </button>
          </div>

          {/* Danger Zone */}
          <div className="border-t-[3px] border-[#FF3366] pt-6">
            <h3 className="text-[16px] font-black uppercase mb-2 tracking-tight text-[#FF3366]">Danger Zone</h3>
            <p className="text-[13px] font-medium mb-4 leading-relaxed opacity-80">
              Once you delete your account, there is no going back. All your alerts, changes, and data will be permanently deleted.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-[13px] font-bold uppercase tracking-wide border-[3px] border-[#FF3366] text-[#FF3366] bg-white hover:bg-[#FF3366] hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
            >
              Delete Account
            </button>
          </div>
        </section>

        {/* Gmail OAuth Section */}
        <section className="border-[3px] border-black bg-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-[#FFE500] opacity-20"></div>
          <h2 className="text-[24px] font-black uppercase mb-2 tracking-tight relative z-10">Email Notifications</h2>
          <p className="text-[14px] font-medium mb-6 leading-relaxed opacity-80 relative z-10">
            Connect your Gmail account to send email notifications from your own
            email address. This gives you 500 free emails per day!
          </p>

          {/* Error Message */}
          {gmailError && (
            <div className="border-[3px] border-[#FF3366] bg-[#FFE5E5] p-4 mb-4 relative z-10">
              <p className="text-[13px] font-bold text-[#FF3366] uppercase tracking-wide mb-1">
                Error
              </p>
              <p className="text-[14px] font-medium">{gmailError}</p>
            </div>
          )}

          {/* Success Message */}
          {gmailSuccess && (
            <div className="border-[3px] border-[#00FF00] bg-[#E5FFE5] p-4 mb-4 relative z-10">
              <p className="text-[13px] font-bold text-green-800 uppercase tracking-wide mb-1">
                Success
              </p>
              <p className="text-[14px] font-medium text-green-900">{gmailSuccess}</p>
            </div>
          )}

          <div className="border-[3px] border-black p-4 bg-[#FAFAFA] relative z-10">
            {gmailStatus.connected ? (
              <div className="space-y-4">
                {/* Connected Status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-[#00FF00] border-[3px] border-black flex items-center justify-center flex-shrink-0">
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
                      <p className="text-[14px] font-black uppercase tracking-wide">Gmail Connected</p>
                      <p className="text-[13px] font-medium opacity-70 truncate">{gmailStatus.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnectGmail}
                    className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide border-[3px] border-[#FF3366] text-[#FF3366] bg-white hover:bg-[#FF3366] hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] flex-shrink-0"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Benefits */}
                <div className="border-[3px] border-black bg-white p-4">
                  <p className="text-[12px] font-black uppercase tracking-wide mb-3">Benefits:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="text-[#00FF00] font-black flex-shrink-0">✓</span>
                      <span>Send up to 500 emails per day for free</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="text-[#00FF00] font-black flex-shrink-0">✓</span>
                      <span>Emails sent from your own Gmail address</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="text-[#00FF00] font-black flex-shrink-0">✓</span>
                      <span>Better deliverability (won&apos;t go to spam)</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="text-[#00FF00] font-black flex-shrink-0">✓</span>
                      <span>No monthly subscription fees</span>
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
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-black uppercase tracking-wide mb-2">Gmail Not Connected</p>
                    <p className="text-[13px] font-medium mb-4 leading-relaxed opacity-80">
                      Connect your Gmail account to send email notifications from your
                      own email address. Free and secure!
                    </p>
                    <button
                      onClick={handleConnectGmail}
                      disabled={isSigningIn}
                      className="bg-black text-white py-2 px-6 text-[13px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#FFE500] hover:text-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSigningIn ? 'Connecting...' : 'Connect Gmail'}
                    </button>
                  </div>
                </div>

                {/* Why Connect */}
                <div className="border-t-[3px] border-black pt-4">
                  <p className="text-[12px] font-black uppercase tracking-wide mb-3">Why connect Gmail?</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>Send alerts from your own email address</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>500 free emails per day (Gmail&apos;s limit)</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>Better deliverability than third-party services</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>No subscription fees required</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] font-medium">
                      <span className="font-black flex-shrink-0">•</span>
                      <span>Your credentials are encrypted and secure</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 border-[3px] border-black bg-[#FFE500] p-4 relative z-10">
            <p className="text-[13px] font-medium leading-relaxed">
              <strong className="font-black uppercase text-[12px] tracking-wide">Privacy Note:</strong> We only request permission to send emails
              on your behalf. We cannot read your emails or access any other Gmail
              data. Your OAuth tokens are encrypted and stored securely.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-black mt-auto py-3 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <p className="text-[12px] font-bold uppercase tracking-wide opacity-60">
            © 2025 AlertFrame
          </p>
        </div>
      </footer>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[4px] border-[#FF3366] max-w-md w-full p-6 relative">
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
