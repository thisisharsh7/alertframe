export default function PrivacyPolicy() {
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
        <h1 className="text-[40px] sm:text-[48px] font-black uppercase mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-[15px] leading-relaxed">
          <p className="font-medium">
            <strong>Last Updated:</strong> January 2025
          </p>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">1. Information We Collect</h2>
            <p className="mb-3">
              AlertFrame collects and processes the following information:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Google Account Information:</strong> Email address, name, and profile picture via Google OAuth</li>
              <li><strong>Gmail Access:</strong> OAuth tokens to send notification emails on your behalf</li>
              <li><strong>Alert Data:</strong> URLs you monitor, selected elements, check frequencies, and alert history</li>
              <li><strong>API Keys:</strong> Your OnKernel API key (encrypted and stored securely)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>To authenticate your account via Google OAuth</li>
              <li>To monitor websites and detect changes based on your alerts</li>
              <li>To send email notifications when changes are detected</li>
              <li>To load and display websites in our element selector</li>
              <li>To improve and maintain the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">3. Data Storage and Security</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Database:</strong> All data is stored in a secure PostgreSQL database</li>
              <li><strong>Encryption:</strong> OAuth tokens and API keys are encrypted at rest</li>
              <li><strong>Access:</strong> Only you can access your alerts and data</li>
              <li><strong>Retention:</strong> Data is retained until you delete your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">4. Third-Party Services</h2>
            <p className="mb-3">AlertFrame uses the following third-party services:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Google OAuth & Gmail API:</strong> For authentication and sending emails</li>
              <li><strong>OnKernel:</strong> For loading websites in our iframe selector</li>
              <li><strong>Playwright:</strong> For automated web scraping and change detection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">5. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Access your personal data</li>
              <li>Delete your account and all associated data</li>
              <li>Revoke Google OAuth access at any time</li>
              <li>Export your alert data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">6. Data Sharing</h2>
            <p>
              We do not sell, trade, or share your personal information with third parties except as necessary to provide the service (e.g., Google for authentication, OnKernel for website loading).
            </p>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">7. Cookies</h2>
            <p>
              AlertFrame uses session cookies for authentication purposes only. No tracking or advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-[24px] font-black uppercase mb-3">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:{' '}
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
