import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export interface ScrapeResult {
  htmlContent: string;
  textContent: string;
  itemCount: number | null;
  success: boolean;
  error?: string;
}

/**
 * Scrape a specific element from a webpage
 */
export async function scrapeElement(
  url: string,
  cssSelector: string
): Promise<ScrapeResult> {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

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
