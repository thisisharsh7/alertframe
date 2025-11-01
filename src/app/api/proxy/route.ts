import { NextRequest, NextResponse } from 'next/server';
import { Kernel } from '@onkernel/sdk';
import { chromium } from 'playwright-core';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  let browser;

  try {
    // Validate URL
    new URL(url);

    // Get user session - authentication required
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's API key (NO FALLBACK)
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { kernelApiKey: true },
    });

    if (!user?.kernelApiKey) {
      return NextResponse.json(
        {
          error: 'Kernel API key required',
          message: 'Please add your Kernel API key in Settings to use browser automation. Get your free API key at dashboard.onkernel.com',
          requiresApiKey: true
        },
        { status: 400 }
      );
    }

    let apiKey: string;
    try {
      // Decrypt user's API key
      apiKey = decrypt(user.kernelApiKey);
      console.log('[Proxy] Using user API key for:', session.user.email);
    } catch (err) {
      console.error('[Proxy] Failed to decrypt user API key:', err);
      return NextResponse.json(
        {
          error: 'Invalid API key',
          message: 'Your API key could not be decrypted. Please delete and re-add it in Settings.',
        },
        { status: 500 }
      );
    }

    console.log('[Proxy] Creating OnKernel browser for:', url);

    // Initialize OnKernel client with user's API key
    const kernel = new Kernel({ apiKey });

    // Create OnKernel browser (sub-millisecond startup!)
    const kernelBrowser = await kernel.browsers.create();

    // Connect Playwright to OnKernel browser
    browser = await chromium.connectOverCDP(kernelBrowser.cdp_ws_url);

    const page = await browser.newPage();

    // Set viewport (Playwright API)
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Get the page content
    const html = await page.content();

    // Close browser
    await browser.close();

    // Extract head and body content properly
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const headContent = headMatch ? headMatch[1] : '';
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    // Inject our selector overlay script
    const modifiedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <base href="${url}">
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${headContent}
          <style>
            * {
              user-select: none !important;
            }
            .selector-overlay {
              position: absolute !important;
              pointer-events: none !important;
              border: 2px solid #3b82f6 !important;
              background: rgba(59, 130, 246, 0.1) !important;
              z-index: 2147483647 !important;
              transition: all 0.1s ease !important;
              box-sizing: border-box !important;
            }
            .selector-selected {
              border: 3px solid #10b981 !important;
              background: rgba(16, 185, 129, 0.15) !important;
            }
            .selector-tooltip {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${bodyContent}

          <script>
            (function() {
              let overlay = null;
              let tooltip = null;
              let selectedElement = null;
              let currentHoverElement = null;
              let isInitialized = false;
              let observer = null;

              // Create overlay with error handling
              function createOverlay() {
                try {
                  // Check if body exists
                  if (!document.body) {
                    console.error('[Selector] document.body not available yet');
                    return false;
                  }

                  // Remove existing overlays if they exist
                  if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                  }
                  if (tooltip && tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                  }

                  // Create new overlay
                  overlay = document.createElement('div');
                  overlay.className = 'selector-overlay';
                  overlay.setAttribute('data-selector-element', 'true');
                  document.body.appendChild(overlay);

                  // Create new tooltip
                  tooltip = document.createElement('div');
                  tooltip.className = 'selector-tooltip';
                  tooltip.setAttribute('data-selector-element', 'true');
                  document.body.appendChild(tooltip);

                  console.log('[Selector] Overlay created successfully');
                  return true;
                } catch (error) {
                  console.error('[Selector] Failed to create overlay:', error);
                  return false;
                }
              }

              // Check if overlays still exist in DOM
              function ensureOverlaysExist() {
                try {
                  if (!overlay || !overlay.parentNode || !tooltip || !tooltip.parentNode) {
                    console.log('[Selector] Overlays missing, recreating...');
                    return createOverlay();
                  }
                  return true;
                } catch (error) {
                  console.error('[Selector] Error checking overlays:', error);
                  return false;
                }
              }

              // Generate CSS selector for element
              function getSelector(element) {
                try {
                  if (!element || !element.tagName) return 'unknown';

                  if (element.id) {
                    return '#' + element.id;
                  }

                  if (element.className && typeof element.className === 'string') {
                    const classes = element.className.split(' ').filter(c => c && !c.startsWith('selector-'));
                    if (classes.length > 0) {
                      return element.tagName.toLowerCase() + '.' + classes.join('.');
                    }
                  }

                  // Use nth-child if no id or class
                  const parent = element.parentElement;
                  if (parent) {
                    const index = Array.from(parent.children).indexOf(element) + 1;
                    return getSelector(parent) + ' > ' + element.tagName.toLowerCase() + ':nth-child(' + index + ')';
                  }

                  return element.tagName.toLowerCase();
                } catch (error) {
                  console.error('[Selector] Error generating selector:', error);
                  return 'unknown';
                }
              }

              // Count child elements
              function countItems(element) {
                try {
                  if (!element || !element.children) return null;

                  const children = element.children;
                  if (children.length > 2) {
                    // Check if children are similar (likely a list)
                    const firstTag = children[0]?.tagName;
                    const allSame = Array.from(children).every(child => child.tagName === firstTag);
                    if (allSame) {
                      return children.length;
                    }
                  }
                  return null;
                } catch (error) {
                  console.error('[Selector] Error counting items:', error);
                  return null;
                }
              }

              // Update overlay position
              function updateOverlay(element) {
                try {
                  if (!element || !element.getBoundingClientRect) return;

                  // Ensure overlays exist
                  if (!ensureOverlaysExist()) return;

                  const rect = element.getBoundingClientRect();
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                  overlay.style.top = (rect.top + scrollTop) + 'px';
                  overlay.style.left = (rect.left + scrollLeft) + 'px';
                  overlay.style.width = rect.width + 'px';
                  overlay.style.height = rect.height + 'px';
                  overlay.style.display = 'block';

                  const selector = getSelector(element);
                  const itemCount = countItems(element);
                  const tooltipText = itemCount
                    ? selector + ' (' + itemCount + ' items)'
                    : selector;

                  tooltip.textContent = tooltipText;
                  tooltip.style.top = (rect.top + scrollTop - 30) + 'px';
                  tooltip.style.left = (rect.left + scrollLeft) + 'px';
                  tooltip.style.display = 'block';
                } catch (error) {
                  console.error('[Selector] Error updating overlay:', error);
                }
              }

              // Hide overlay
              function hideOverlay() {
                try {
                  if (overlay) overlay.style.display = 'none';
                  if (tooltip) tooltip.style.display = 'none';
                } catch (error) {
                  console.error('[Selector] Error hiding overlay:', error);
                }
              }

              // Setup MutationObserver to watch for DOM changes
              function setupObserver() {
                try {
                  if (!window.MutationObserver) {
                    console.warn('[Selector] MutationObserver not available');
                    return;
                  }

                  observer = new MutationObserver(function(mutations) {
                    // Check if our overlays were removed
                    let needsRecreate = false;
                    for (const mutation of mutations) {
                      if (mutation.type === 'childList') {
                        for (const node of mutation.removedNodes) {
                          if (node === overlay || node === tooltip) {
                            needsRecreate = true;
                            break;
                          }
                        }
                      }
                      if (needsRecreate) break;
                    }

                    if (needsRecreate) {
                      console.log('[Selector] Overlay removed by page, recreating...');
                      ensureOverlaysExist();
                    }
                  });

                  observer.observe(document.body, {
                    childList: true,
                    subtree: false
                  });

                  console.log('[Selector] MutationObserver setup complete');
                } catch (error) {
                  console.error('[Selector] Error setting up observer:', error);
                }
              }

              // Setup event listeners
              function setupEventListeners() {
                try {
                  // Mouse move handler
                  document.addEventListener('mouseover', function(e) {
                    if (!e.target || e.target === document.body || e.target === overlay || e.target === tooltip) {
                      hideOverlay();
                      currentHoverElement = null;
                      return;
                    }

                    currentHoverElement = e.target;
                    if (selectedElement !== e.target) {
                      updateOverlay(e.target);
                    }
                  }, true);

                  document.addEventListener('mouseout', function(e) {
                    if (!selectedElement) {
                      hideOverlay();
                      currentHoverElement = null;
                    }
                  }, true);

                  // Scroll handler - update overlay position on scroll
                  let scrollTimeout;
                  window.addEventListener('scroll', function() {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(function() {
                      if (selectedElement) {
                        updateOverlay(selectedElement);
                      } else if (currentHoverElement) {
                        updateOverlay(currentHoverElement);
                      }
                    }, 10);
                  }, true);

                  // Click handler
                  document.addEventListener('click', function(e) {
                    try {
                      e.preventDefault();
                      e.stopPropagation();

                      if (!e.target) return false;

                      // Clear previous selection
                      if (selectedElement && overlay) {
                        overlay.classList.remove('selector-selected');
                      }

                      selectedElement = e.target;
                      if (overlay) {
                        overlay.classList.add('selector-selected');
                      }
                      updateOverlay(selectedElement);

                      // Send selection to parent window
                      const selector = getSelector(selectedElement);
                      const itemCount = countItems(selectedElement);
                      const html = selectedElement.outerHTML || '';
                      const text = selectedElement.innerText?.substring(0, 500) || '';

                      window.parent.postMessage({
                        type: 'ELEMENT_SELECTED',
                        data: {
                          selector: selector,
                          html: html.substring(0, 1000),
                          text: text,
                          itemCount: itemCount,
                          elementType: itemCount ? 'list' : 'single',
                        }
                      }, '*');

                      return false;
                    } catch (error) {
                      console.error('[Selector] Error in click handler:', error);
                      return false;
                    }
                  }, true);

                  // Prevent default actions
                  document.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    return false;
                  }, true);

                  console.log('[Selector] Event listeners setup complete');
                } catch (error) {
                  console.error('[Selector] Error setting up event listeners:', error);
                }
              }

              // Initialize selector with retry logic
              function initialize() {
                if (isInitialized) return;

                try {
                  console.log('[Selector] Initializing...');

                  // Create overlay
                  if (!createOverlay()) {
                    console.error('[Selector] Failed to create overlay, will retry...');
                    return false;
                  }

                  // Setup observer
                  setupObserver();

                  // Setup event listeners
                  setupEventListeners();

                  isInitialized = true;
                  console.log('[Selector] Initialization complete');

                  // Notify parent that selector is ready
                  window.parent.postMessage({ type: 'SELECTOR_READY' }, '*');

                  return true;
                } catch (error) {
                  console.error('[Selector] Initialization error:', error);
                  return false;
                }
              }

              // Retry initialization with exponential backoff
              function initWithRetry(attempt) {
                attempt = attempt || 0;
                const maxAttempts = 10;

                if (attempt >= maxAttempts) {
                  console.error('[Selector] Max initialization attempts reached');
                  window.parent.postMessage({
                    type: 'SELECTOR_ERROR',
                    error: 'Failed to initialize after ' + maxAttempts + ' attempts'
                  }, '*');
                  return;
                }

                if (initialize()) {
                  return;
                }

                // Retry with exponential backoff
                const delay = Math.min(100 * Math.pow(2, attempt), 2000);
                console.log('[Selector] Retrying in ' + delay + 'ms (attempt ' + (attempt + 1) + '/' + maxAttempts + ')');
                setTimeout(function() {
                  initWithRetry(attempt + 1);
                }, delay);
              }

              // Start initialization when DOM is ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                  console.log('[Selector] DOMContentLoaded event fired');
                  initWithRetry(0);
                });
              } else {
                // DOM already loaded
                console.log('[Selector] DOM already loaded, initializing immediately');
                initWithRetry(0);
              }

              // Also try immediate initialization as fallback
              setTimeout(function() {
                if (!isInitialized) {
                  console.log('[Selector] Attempting immediate initialization');
                  initWithRetry(0);
                }
              }, 100);
            })();
          </script>
        </body>
      </html>
    `;

    return new NextResponse(modifiedHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
      },
    });

  } catch (error) {
    if (browser) {
      await browser.close();
    }

    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to load URL', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
