'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BellLoader from '@/components/BellLoader';

// Map error codes to user-friendly messages
const getErrorMessage = (errorCode: string): { title: string; details: string; canRetry: boolean } => {
  const errorMap: Record<string, { title: string; details: string; canRetry: boolean }> = {
    Configuration: {
      title: 'Configuration Error',
      details: 'There was a problem with the authentication setup. This could be due to missing Gmail permissions or a token storage issue. Please try signing in again.',
      canRetry: true,
    },
    AccessDenied: {
      title: 'Access Denied',
      details: 'You denied the required Gmail permissions. We need permission to send emails on your behalf to use AlertFrame.',
      canRetry: true,
    },
    OAuthCreateAccount: {
      title: 'Account Creation Failed',
      details: 'We encountered an error while setting up your account. Please try again. If the problem persists, contact support.',
      canRetry: true,
    },
    OAuthCallback: {
      title: 'Authentication Failed',
      details: 'The authentication callback failed. This might be due to a redirect URI mismatch. Please try again.',
      canRetry: true,
    },
    Default: {
      title: 'Sign In Failed',
      details: 'An unexpected error occurred. Please check your internet connection and try again.',
      canRetry: true,
    },
  };

  return errorMap[errorCode] || errorMap.Default;
};

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; details: string; canRetry: boolean } | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorInfo = getErrorMessage(errorParam);
      setError(errorInfo);
      console.error('[SignIn] Error from URL:', errorParam, errorInfo);
    }
  }, [searchParams]);

  const handleGoogleSignIn = () => {
    // Prevent multiple simultaneous sign-in attempts
    if (isLoading) {
      console.warn('[SignIn] Sign-in already in progress, ignoring');
      return;
    }

    // Set loading state synchronously before async operation
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);

    console.log('[SignIn] Starting Google OAuth sign-in', {
      callbackUrl,
      retryCount: retryCount + 1,
    });

    // Use setTimeout to ensure state update renders before redirect
    setTimeout(() => {
      signIn('google', {
        callbackUrl,
        redirect: true,
      }).catch((err) => {
        console.error('[SignIn] Error during sign-in:', err);

        // Parse error message for better user feedback
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
        setError({
          title: 'Sign In Failed',
          details: errorMessage,
          canRetry: true,
        });
        setIsLoading(false);
      });
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="border-b-[3px] border-black bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-1 sm:gap-1.5 group cursor-pointer"
              onClick={() => router.push('/')}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="sm:w-[28px] sm:h-[28px] transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12"
              >
                <path
                  d="M14 4C11 4 9 6 9 9V13L7 17H21L19 13V9C19 6 17 4 14 4Z"
                  fill="#FFE500"
                  stroke="#000000"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 17V18C12 19.1 12.9 20 14 20C15.1 20 16 19.1 16 18V17"
                  stroke="#000000"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="19" cy="7.5" r="3" fill="#FF3366" stroke="#000000" strokeWidth="2" />
              </svg>
              <span className="text-[18px] sm:text-[21px] font-black tracking-tight uppercase leading-none">
                AlertFrame
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Sign In Card */}
          <div className="border-[3px] border-black bg-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-[#FFE500] opacity-20"></div>

            {/* Logo/Icon */}
            <div className="flex justify-center mb-6 relative z-10">
              <svg
                width="64"
                height="64"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 4C11 4 9 6 9 9V13L7 17H21L19 13V9C19 6 17 4 14 4Z"
                  fill="#FFE500"
                  stroke="#000000"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 17V18C12 19.1 12.9 20 14 20C15.1 20 16 19.1 16 18V17"
                  stroke="#000000"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="19" cy="7.5" r="3" fill="#FF3366" stroke="#000000" strokeWidth="2" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-[28px] sm:text-[32px] font-black uppercase tracking-tight mb-3 sm:mb-4 text-center relative z-10">
              Sign In
            </h1>

            {/* Description */}
            <p className="text-[15px] sm:text-[16px] font-medium mb-6 sm:mb-8 leading-relaxed text-center opacity-80 relative z-10">
              Connect your Gmail to start monitoring websites and receive email alerts.
            </p>

            {/* Error Message */}
            {error && (
              <div className="border-[3px] border-[#FF3366] bg-[#FFE5E5] p-4 mb-6 relative z-10">
                <p className="text-[13px] font-bold text-[#FF3366] uppercase tracking-wide mb-2">
                  {error.title}
                </p>
                <p className="text-[14px] font-medium mb-3 leading-relaxed">{error.details}</p>
                {error.canRetry && retryCount > 0 && (
                  <p className="text-[12px] font-medium opacity-70">
                    Attempt #{retryCount}
                  </p>
                )}
              </div>
            )}

            {/* Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-black text-white py-4 px-4 text-[14px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#FFE500] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] relative z-10 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <BellLoader />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="mt-6 border-[3px] border-black bg-[#FAFAFA] p-4 relative z-10">
              <p className="text-[12px] font-medium leading-relaxed">
                <strong className="font-black uppercase tracking-wide">Why Google?</strong> We use
                your Gmail to send alert emails directly from your account. This ensures better
                deliverability and gives you 500 free emails per day!
              </p>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-4 text-center">
            <p className="text-[12px] font-medium opacity-60">
              We only request permission to send emails. We cannot read your emails or access any
              other Gmail data.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-black py-2.5 sm:py-3 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide opacity-60">
            © 2025 AlertFrame
          </p>
        </div>
      </footer>
    </div>
  );
}
