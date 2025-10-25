export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="border-b-[3px] border-black bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[28px] sm:h-[28px]">
              <path d="M14 4C11 4 9 6 9 9V13L7 17H21L19 13V9C19 6 17 4 14 4Z" fill="#FFE500" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M12 17V18C12 19.1 12.9 20 14 20C15.1 20 16 19.1 16 18V17" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="19" cy="7.5" r="3" fill="#FF3366" stroke="#000000" strokeWidth="2" />
            </svg>
            <span className="text-[17px] sm:text-[21px] font-black tracking-tight uppercase leading-none">AlertFrame</span>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-[40px] sm:text-[48px] font-black uppercase mb-8">Terms of Service</h1>

        <div className="space-y-6 text-[15px] leading-relaxed">
          <p className="font-medium">
            <strong>Last Updated:</strong> January 2025
          </p>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using AlertFrame, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">2. Description of Service</h2>
            <p>
              AlertFrame is a website monitoring tool that allows users to track changes on web pages and receive email notifications. The service includes:
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-3">
              <li>Visual element selection on any website</li>
              <li>Automated change detection</li>
              <li>Email notifications via Gmail API</li>
              <li>Alert management dashboard</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">3. User Accounts</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>You must sign in with a valid Google account to use AlertFrame</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide your own OnKernel API key for the element selector functionality</li>
              <li>You are responsible for all activity under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree NOT to use AlertFrame to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Monitor websites in violation of their terms of service or robots.txt</li>
              <li>Scrape or collect data for malicious purposes</li>
              <li>Overload or disrupt our servers or third-party services</li>
              <li>Access content that you do not have permission to view</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">5. Service Limitations</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>AlertFrame is provided "as is" without warranties of any kind</li>
              <li>We do not guarantee 100% uptime or alert delivery</li>
              <li>Check frequency depends on your configuration and system availability</li>
              <li>Some websites may block automated monitoring</li>
              <li>OnKernel API usage is subject to your own API key limits and costs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">6. Third-Party Services</h2>
            <p className="mb-3">AlertFrame integrates with:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Google OAuth & Gmail API:</strong> Subject to Google's Terms of Service</li>
              <li><strong>OnKernel:</strong> Subject to OnKernel's Terms of Service and pricing</li>
              <li>You are responsible for compliance with all third-party terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">7. Costs and Billing</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>AlertFrame is currently free to use</li>
              <li>You are responsible for OnKernel API costs associated with your usage</li>
              <li>OnKernel offers a free tier with $5/month credits (~1,000 page loads)</li>
              <li>We reserve the right to introduce pricing in the future with notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">8. Data and Privacy</h2>
            <p>
              Your use of AlertFrame is also governed by our{' '}
              <a href="/privacy" className="font-bold underline">Privacy Policy</a>.
              We collect and process data as described in that policy.
            </p>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">9. Termination</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>You may delete your account at any time from the settings page</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
              <li>Upon termination, all your data will be permanently deleted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">10. Limitation of Liability</h2>
            <p>
              AlertFrame and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes by updating the "Last Updated" date. Continued use of the service constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">12. Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">13. Contact Information</h2>
            <p>
              For questions about these Terms of Service, contact us at:{' '}
              <a href="mailto:9u.harsh@gmail.com" className="font-bold underline">
                9u.harsh@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t-[3px] border-black mt-12 py-2.5 sm:py-3 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wide opacity-60">
            © 2025 AlertFrame
          </p>
        </div>
      </footer>
    </div>
  );
}
