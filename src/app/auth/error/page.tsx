'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    const errorCode = searchParams.get('error');

    // Map NextAuth error codes to user-friendly messages
    const errorMessages: Record<string, { title: string; details: string }> = {
      Configuration: {
        title: 'Server Configuration Error',
        details: 'There is a problem with the server configuration. Please contact support.',
      },
      AccessDenied: {
        title: 'Access Denied',
        details: 'You do not have permission to sign in. Please contact support if you believe this is an error.',
      },
      Verification: {
        title: 'Verification Failed',
        details: 'The verification token has expired or has already been used. Please try signing in again.',
      },
      OAuthSignin: {
        title: 'OAuth Sign In Error',
        details: 'There was an error starting the OAuth sign-in flow. Please try again.',
      },
      OAuthCallback: {
        title: 'OAuth Callback Error',
        details: 'There was an error during the OAuth callback. This could be due to a redirect URI mismatch in your OAuth provider settings.',
      },
      OAuthCreateAccount: {
        title: 'Account Creation Error',
        details: 'There was an error creating your account. Please try again or contact support.',
      },
      EmailCreateAccount: {
        title: 'Email Account Creation Error',
        details: 'There was an error creating your account with email. Please try again.',
      },
      Callback: {
        title: 'Callback Error',
        details: 'There was an error during the authentication callback. Please try again.',
      },
      OAuthAccountNotLinked: {
        title: 'Account Already Exists',
        details: 'An account with this email already exists. Please sign in with your original method.',
      },
      EmailSignin: {
        title: 'Email Sign In Error',
        details: 'There was an error sending the verification email. Please try again.',
      },
      CredentialsSignin: {
        title: 'Sign In Failed',
        details: 'The credentials you provided are incorrect. Please try again.',
      },
      SessionRequired: {
        title: 'Session Required',
        details: 'You must be signed in to access this page.',
      },
      Default: {
        title: 'Authentication Error',
        details: 'An unexpected error occurred during authentication. Please try again.',
      },
    };

    const errorInfo = errorMessages[errorCode || 'Default'] || errorMessages.Default;
    setError(errorInfo.title);
    setErrorDetails(errorInfo.details);

    // Log error for debugging
    console.error('[Auth Error]', {
      errorCode,
      url: window.location.href,
      searchParams: Object.fromEntries(searchParams.entries()),
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="border-[3px] border-black bg-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-[#FF3366] opacity-20"></div>

          {/* Error Icon */}
          <div className="w-16 h-16 bg-[#FF3366] border-[3px] border-black flex items-center justify-center mb-6 relative z-10">
            <svg
              className="w-8 h-8"
              fill="none"
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="#000000"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="text-[32px] font-black uppercase tracking-tight mb-4 relative z-10">
            {error || 'Authentication Error'}
          </h1>

          {/* Error Details */}
          <p className="text-[16px] font-medium mb-8 leading-relaxed opacity-80 relative z-10">
            {errorDetails}
          </p>

          {/* Actions */}
          <div className="space-y-3 relative z-10">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-black text-white py-3 px-4 text-[14px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#FFE500] hover:text-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
            >
              Go to Home
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="w-full bg-white text-black py-3 px-4 text-[14px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#06B6D4] hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
            >
              Try Again
            </button>
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 border-[3px] border-black bg-yellow-50 p-4">
            <p className="text-[12px] font-black uppercase tracking-wide mb-2">Debug Info:</p>
            <pre className="text-[11px] font-mono overflow-auto">
              {JSON.stringify(
                {
                  error: searchParams.get('error'),
                  allParams: Object.fromEntries(searchParams.entries()),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
          <div className="text-[14px] font-bold uppercase tracking-wide">Loading...</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
