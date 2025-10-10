import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Validate URL
    new URL(url);

    // Detect if running on Vercel (serverless)
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';

    // Configure Puppeteer based on environment
    const launchOptions = isProduction && isVercel
      ? {
          // Vercel serverless configuration
          args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport: { width: 1280, height: 800 },
          executablePath: await chromium.executablePath('/tmp/.cache/puppeteer'),
          headless: chromium.headless,
        }
      : {
          // Local development configuration
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
        };

    console.log('[Proxy] Launching browser:', {
      isProduction,
      isVercel,
      environment: isProduction && isVercel ? 'vercel-serverless' : 'local',
    });

    // Use puppeteer-core on Vercel, regular puppeteer locally
    const browser = isProduction && isVercel
      ? await puppeteerCore.launch(launchOptions)
      : await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle0',
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
              position: absolute;
              pointer-events: none;
              border: 2px solid #3b82f6;
              background: rgba(59, 130, 246, 0.1);
              z-index: 999999;
              transition: all 0.1s ease;
            }
            .selector-selected {
              border: 3px solid #10b981;
              background: rgba(16, 185, 129, 0.15);
            }
            .selector-tooltip {
              position: absolute;
              background: #1f2937;
              color: white;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-family: monospace;
              z-index: 1000000;
              pointer-events: none;
              white-space: nowrap;
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

              // Create overlay
              function createOverlay() {
                overlay = document.createElement('div');
                overlay.className = 'selector-overlay';
                document.body.appendChild(overlay);

                tooltip = document.createElement('div');
                tooltip.className = 'selector-tooltip';
                document.body.appendChild(tooltip);
              }

              // Generate CSS selector for element
              function getSelector(element) {
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
              }

              // Count child elements
              function countItems(element) {
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
              }

              // Update overlay position
              function updateOverlay(element) {
                if (!overlay || !tooltip) return;

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
              }

              // Hide overlay
              function hideOverlay() {
                if (overlay) overlay.style.display = 'none';
                if (tooltip) tooltip.style.display = 'none';
              }

              // Initialize
              createOverlay();

              let currentHoverElement = null;

              // Mouse move handler
              document.addEventListener('mouseover', function(e) {
                if (e.target === document.body || e.target === overlay || e.target === tooltip) {
                  hideOverlay();
                  currentHoverElement = null;
                  return;
                }

                currentHoverElement = e.target;
                if (selectedElement !== e.target) {
                  updateOverlay(e.target);
                }
              });

              document.addEventListener('mouseout', function(e) {
                if (!selectedElement) {
                  hideOverlay();
                  currentHoverElement = null;
                }
              });

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
                e.preventDefault();
                e.stopPropagation();

                // Clear previous selection
                if (selectedElement) {
                  overlay.classList.remove('selector-selected');
                }

                selectedElement = e.target;
                overlay.classList.add('selector-selected');
                updateOverlay(selectedElement);

                // Send selection to parent window
                const selector = getSelector(selectedElement);
                const itemCount = countItems(selectedElement);
                const html = selectedElement.outerHTML;
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
              }, true);

              // Prevent default actions
              document.addEventListener('mousedown', function(e) {
                e.preventDefault();
                return false;
              }, true);

              // Notify parent that selector is ready
              window.parent.postMessage({ type: 'SELECTOR_READY' }, '*');
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
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to load URL', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
