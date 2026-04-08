import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface WttjJobData {
  title: string;
  company: string;
  location: string;
  industry: string;
  salaryMin: number | null;
  salaryMax: number | null;
  url: string;
  notes: string;
}

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url: string };

    if (!url || !isWttjJobUrl(url)) {
      return NextResponse.json(
        { error: "Please provide a valid Welcome to the Jungle job URL" },
        { status: 400 }
      );
    }

    const { html, finalUrl } = await fetchPage(url);
    const data = parseJobData(html, url, finalUrl);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch job data. The page may be unavailable or require authentication." },
      { status: 500 }
    );
  }
}

function isWttjJobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("welcometothejungle.com") ||
      parsed.hostname.includes("wttj.co")
    );
  } catch {
    return false;
  }
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string }> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return { html: await response.text(), finalUrl: response.url };
}

function parseJobData(html: string, originalUrl: string, finalUrl: string): WttjJobData {
  const $ = cheerio.load(html);

  // Try JSON-LD structured data first (most reliable, works for WTTJ + redirected career pages)
  const jsonLd = extractJsonLd($);

  const title = jsonLd?.title || extractTitle($);
  const company = jsonLd?.company || extractCompany($);
  const location = jsonLd?.location || extractLocation($);
  const industry = jsonLd?.industry || extractIndustry($);
  const salary = jsonLd?.salary || extractSalaryFromText($);
  const description = jsonLd?.description || extractDescription($);

  return {
    title,
    company,
    location,
    industry,
    salaryMin: salary.min,
    salaryMax: salary.max,
    url: originalUrl,
    notes: description,
  };
}

interface JsonLdResult {
  title: string;
  company: string;
  location: string;
  industry: string;
  description: string;
  salary: { min: number | null; max: number | null };
}

function extractJsonLd($: cheerio.CheerioAPI): JsonLdResult | null {
  let result: JsonLdResult | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      if (data["@type"] === "JobPosting") {
        result = {
          title: data.title || "",
          company: data.hiringOrganization?.name || "",
          location: formatJsonLdLocation(data.jobLocation),
          industry:
            data.industry ||
            data.occupationalCategory ||
            data.hiringOrganization?.industry ||
            "",
          description: cleanHtml(data.description || ""),
          salary: parseJsonLdSalary(data.baseSalary),
        };
      }
    } catch {
      // Skip invalid JSON-LD
    }
  });

  return result;
}

function formatJsonLdLocation(jobLocation: unknown): string {
  if (!jobLocation) return "";

  if (Array.isArray(jobLocation)) {
    return jobLocation
      .map((loc: Record<string, unknown>) => {
        const address = loc.address as Record<string, string> | undefined;
        if (address) {
          return [address.addressLocality, address.addressRegion, address.addressCountry]
            .filter(Boolean)
            .join(", ");
        }
        return (loc.name as string) || "";
      })
      .filter(Boolean)
      .join(" | ");
  }

  const loc = jobLocation as Record<string, unknown>;
  const address = loc.address as Record<string, string> | undefined;
  if (address) {
    return [address.addressLocality, address.addressRegion, address.addressCountry]
      .filter(Boolean)
      .join(", ");
  }

  return (loc.name as string) || "";
}

function parseJsonLdSalary(baseSalary: unknown): { min: number | null; max: number | null } {
  if (!baseSalary) return { min: null, max: null };

  const salary = baseSalary as Record<string, unknown>;
  const value = salary.value as Record<string, unknown> | undefined;
  if (!value) return { min: null, max: null };

  const min = typeof value.minValue === "number" ? value.minValue : null;
  const max = typeof value.maxValue === "number" ? value.maxValue : null;

  return { min, max };
}

function extractTitle($: cheerio.CheerioAPI): string {
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  if (ogTitle) return cleanTitle(ogTitle);

  const pageTitle = $("title").text();
  if (pageTitle) return cleanTitle(pageTitle);

  return $("h1").first().text().trim() || "";
}

function cleanTitle(raw: string): string {
  // Remove trailing site name suffixes like "| Welcome to the Jungle", "| WTTJ", etc.
  return raw.replace(/\s*[|–-].*$/, "").trim();
}

function extractCompany($: cheerio.CheerioAPI): string {
  // WTTJ-specific selectors
  const company =
    $('[data-testid="job-header-company-name"]').first().text().trim() ||
    $('[class*="company-name"]').first().text().trim() ||
    $('[class*="companyName"]').first().text().trim();

  if (company) return company;

  // Try og:title patterns like "Title at Company | Welcome to the Jungle"
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const atMatch = ogTitle.match(/\s+(?:at|@|chez)\s+(.+?)(?:\s*[|–-].*)?$/i);
  if (atMatch) return atMatch[1].trim();

  return "";
}

function extractLocation($: cheerio.CheerioAPI): string {
  return (
    $('[data-testid="job-header-location"]').first().text().trim() ||
    $('[class*="location"]').first().text().trim() ||
    ""
  );
}

function extractIndustry($: cheerio.CheerioAPI): string {
  return (
    $('[data-testid="job-contract-type"]').first().text().trim() ||
    $('[class*="contract"]').first().text().trim() ||
    ""
  );
}

function extractSalaryFromText($: cheerio.CheerioAPI): { min: number | null; max: number | null } {
  const text = $("body").text();
  const match = text.match(/[\$€£]\s?([\d,]+)\s*(?:[-–to]+)\s*[\$€£]?\s?([\d,]+)/i);
  if (match) {
    return {
      min: parseInt(match[1].replace(/,/g, ""), 10) || null,
      max: parseInt(match[2].replace(/,/g, ""), 10) || null,
    };
  }
  return { min: null, max: null };
}

function extractDescription($: cheerio.CheerioAPI): string {
  const ogDesc = $('meta[property="og:description"]').attr("content") || "";
  if (ogDesc) return ogDesc.slice(0, 500);

  const desc = $('meta[name="description"]').attr("content") || "";
  return desc.slice(0, 500);
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}
