import * as cheerio from 'cheerio';
import { Kernel } from '@onkernel/sdk';
import { chromium } from 'playwright-core';
import { prisma } from './db';
import { decrypt } from './encryption';

export interface ScrapeResult {
  htmlContent: string;
  textContent: string;
  itemCount: number | null;
  success: boolean;
  error?: string;
}

/**
 * Scrape a specific element from a webpage using OnKernel
 * Fast, reliable browser automation powered by OnKernel's managed infrastructure
 */
export async function scrapeElement(
  url: string,
  cssSelector: string,
  userId?: string
): Promise<ScrapeResult> {
  let browser;

  try {
    console.log('[Scraper] Creating OnKernel browser for:', url);

    // Get user's API key (NO FALLBACK)
    if (!userId) {
      return {
        htmlContent: '',
        textContent: '',
        itemCount: null,
        success: false,
        error: 'User ID required for browser automation',
      };
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { kernelApiKey: true, email: true },
    });

    if (!user?.kernelApiKey) {
      return {
        htmlContent: '',
        textContent: '',
        itemCount: null,
        success: false,
        error: 'Kernel API key required. Please add your API key in Settings to enable monitoring.',
      };
    }

    let apiKey: string;
    try {
      // Decrypt user's API key
      apiKey = decrypt(user.kernelApiKey);
      console.log('[Scraper] Using user API key for:', user.email);
    } catch (err) {
      console.error('[Scraper] Failed to decrypt user API key:', err);
      return {
        htmlContent: '',
        textContent: '',
        itemCount: null,
        success: false,
        error: 'Failed to decrypt API key. Please delete and re-add it in Settings.',
      };
    }

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

    await browser.close();

    // Parse with cheerio
    const $ = cheerio.load(html);
    const element = $(cssSelector);

    if (element.length === 0) {
      return {
        htmlContent: '',
        textContent: '',
        itemCount: null,
        success: false,
        error: 'Element not found with selector: ' + cssSelector,
      };
    }

    // Extract content
    const htmlContent = element.html() || '';
    const textContent = element.text()?.trim() || '';

    // Count items if it's a list
    const children = element.children();
    let itemCount: number | null = null;

    if (children.length > 2) {
      const firstTag = children.first().prop('tagName');
      const allSame = children.toArray().every(child => child.tagName === firstTag);
      if (allSame) {
        itemCount = children.length;
      }
    }

    return {
      htmlContent,
      textContent,
      itemCount,
      success: true,
    };

  } catch (error) {
    if (browser) {
      await browser.close();
    }

    return {
      htmlContent: '',
      textContent: '',
      itemCount: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown scraping error',
    };
  }
}
