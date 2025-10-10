'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import BellLoader from '@/components/BellLoader';

function SelectorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get('url');

  const [isLoading, setIsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{
    selector: string;
    html: string;
    text: string;
    itemCount: number | null;
    elementType: 'single' | 'list';
  } | null>(null);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!url) {
      router.push('/');
      return;
    }

    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SELECTOR_READY') {
        setIsLoading(false);
      }

      if (event.data.type === 'ELEMENT_SELECTED') {
        setSelectedElement(event.data.data);

        // Auto-navigate on mobile
        if (window.innerWidth < 768) {
          setTimeout(() => {
            const params = new URLSearchParams({
              url: url,
              selector: event.data.data.selector,
              elementType: event.data.data.elementType,
              itemCount: event.data.data.itemCount?.toString() || '0',
            });
            router.push(`/configure?${params.toString()}`);
          }, 300);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [url, router]);

  const handleContinue = () => {
    if (!selectedElement || !url) return;

    // Navigate to configuration page
    const params = new URLSearchParams({
      url: url,
      selector: selectedElement.selector,
      elementType: selectedElement.elementType,
      itemCount: selectedElement.itemCount?.toString() || '0',
    });

    router.push(`/configure?${params.toString()}`);
  };

  if (!url) {
    return null;
  }

  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b-[3px] border-black">
        <div className="px-3 md:px-6 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 px-2 md:px-3 py-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition-colors text-[11px] md:text-[12px] font-bold uppercase whitespace-nowrap"
              >
                <ArrowLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-4 md:h-5 w-[2px] bg-black" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide opacity-60">Monitoring</p>
                <p className="font-bold text-[10px] md:text-[12px] truncate" title={url}>
                  {url}
                </p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              disabled={!selectedElement}
              className="hidden md:flex items-center gap-1.5 px-4 md:px-5 py-1.5 bg-black text-white border-[3px] border-black hover:bg-[#FFE500] hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[12px] font-bold uppercase whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              Continue
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-60px)]">
        {/* Instruction Banner */}
        {showBanner && (
          <div className="bg-[#FFE500] border-b-[3px] border-black px-3 md:px-6 py-2 flex items-center justify-between">
            <p className="text-[11px] md:text-[12px] font-bold">
              <strong className="uppercase">Click</strong> <span className="hidden sm:inline">the element you want to track</span><span className="sm:hidden">element to track</span>
            </p>
            <button
              onClick={() => setShowBanner(false)}
              className="ml-2 md:ml-4 px-2 py-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition-colors text-[10px] md:text-[11px] font-bold"
              aria-label="Close banner"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex relative">
          {/* Iframe Container */}
          <div className="flex-1 relative bg-white">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="text-center">
                  <div className="flex justify-center">
                    <BellLoader />
                  </div>
                  <p className="mt-2 text-[13px] font-bold uppercase">Loading page...</p>
                </div>
              </div>
            )}
            <iframe
              src={proxyUrl}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts"
              title="Page selector"
            />
          </div>

          {/* Selection Info Panel - Desktop Only */}
          {selectedElement && !isMobile && (
            <div className="hidden md:block w-80 border-l-[3px] border-black bg-white p-6 overflow-y-auto">
              <h3 className="font-black text-[20px] mb-6 uppercase">Selected Element</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide opacity-60 block mb-2">
                    Selector
                  </label>
                  <div className="p-3 bg-[#F5F5F5] border-[2px] border-black">
                    <code className="text-[11px] font-mono break-all font-medium">
                      {selectedElement.selector}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide opacity-60 block mb-2">
                    Type
                  </label>
                  <div className="mt-1">
                    {selectedElement.elementType === 'list' ? (
                      <span className="inline-flex items-center px-3 py-2 text-[12px] font-bold uppercase bg-[#00FF00] border-[2px] border-black">
                        List ({selectedElement.itemCount} items)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-2 text-[12px] font-bold uppercase bg-[#FFE500] border-[2px] border-black">
                        Single
                      </span>
                    )}
                  </div>
                </div>

                {selectedElement.text && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide opacity-60 block mb-2">
                      Preview
                    </label>
                    <div className="p-3 bg-[#F5F5F5] border-[2px] border-black max-h-32 overflow-y-auto">
                      <p className="text-[12px] font-medium">
                        {selectedElement.text.substring(0, 200)}
                        {selectedElement.text.length > 200 && '...'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t-[2px] border-black">
                  <p className="text-[11px] font-bold opacity-60">
                    We'll track this element and alert you when it changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Show loading toast when navigating */}
          {selectedElement && isMobile && (
            <div className="fixed bottom-4 left-4 right-4 bg-[#00FF00] border-[3px] border-black p-4 shadow-[6px_6px_0_0_#000] z-50 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-[3px] border-black border-t-transparent animate-spin rounded-full"></div>
                <div className="flex-1">
                  <p className="font-black text-[13px] uppercase">Element Selected!</p>
                  <p className="text-[11px] font-bold opacity-80">Taking you to configuration...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SelectorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <BellLoader />
      </div>
    }>
      <SelectorContent />
    </Suspense>
  );
}
