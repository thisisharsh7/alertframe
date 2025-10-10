import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

// Import serverless Chrome for Vercel deployment
// @ts-ignore - chromium package has type issues but works fine
import chromium from '@sparticuz/chromium';

export interface ScrapeResult {
  htmlContent: string;
  textContent: string;
  itemCount: number | null;
  success: boolean;
  error?: string;
}

/**
 * Scrape a specific element from a webpage
 * Works in both local development and Vercel serverless production
 */
export async function scrapeElement(
  url: string,
  cssSelector: string
): Promise<ScrapeResult> {
  let browser;

  try {
    // Detect if running on Vercel (serverless)
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';

    // Configure Puppeteer based on environment
    const launchOptions = isProduction && isVercel
      ? {
          // Vercel serverless configuration
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
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

    console.log('[Scraper] Launching browser:', {
      isProduction,
      isVercel,
      environment: isProduction && isVercel ? 'vercel-serverless' : 'local',
    });

    browser = await puppeteer.launch(launchOptions);

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
