import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface LinkedInJobData {
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

    if (!url || !isLinkedInJobUrl(url)) {
      return NextResponse.json(
        { error: "Please provide a valid LinkedIn job URL" },
        { status: 400 }
      );
    }

    const html = await fetchPage(url);
    const data = parseJobData(html, url);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch job data from LinkedIn. The page may be unavailable or require authentication." },
      { status: 500 }
    );
  }
}

function isLinkedInJobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("linkedin.com") &&
      (parsed.pathname.includes("/jobs/") || parsed.pathname.includes("/job/"))
    );
  } catch {
    return false;
  }
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
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

  return response.text();
}

function parseJobData(html: string, originalUrl: string): LinkedInJobData {
  const $ = cheerio.load(html);

  // Try JSON-LD structured data first (most reliable)
  const jsonLd = extractJsonLd($);

  // Extract from various sources with fallbacks
  const title = jsonLd?.title || extractTitle($);
  const company = jsonLd?.company || extractCompany($);
  const location = jsonLd?.location || extractLocation($);
  const industry = jsonLd?.industry || extractIndustry($);
  const salary = jsonLd?.salary || extractSalary($);
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
          industry: data.industry || data.occupationalCategory || data.hiringOrganization?.industry || "",
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

function formatJsonLdLocation(
  jobLocation: unknown
): string {
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
        return loc.name || "";
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

function parseJsonLdSalary(
  baseSalary: unknown
): { min: number | null; max: number | null } {
  if (!baseSalary) return { min: null, max: null };

  const salary = baseSalary as Record<string, unknown>;
  const value = salary.value as Record<string, unknown> | undefined;
  if (!value) return { min: null, max: null };

  const min = typeof value.minValue === "number" ? value.minValue : null;
  const max = typeof value.maxValue === "number" ? value.maxValue : null;

  return { min, max };
}

function cleanTitle(raw: string): string {
  let title = raw;

  // Remove trailing "| LinkedIn" or similar
  title = title.replace(/\s*\|.*$/, "").trim();

  // Handle "Company hiring Title in Location" pattern
  const hiringMatch = title.match(/^.+?\s+hiring\s+(.+?)\s+in\s+.+$/i);
  if (hiringMatch) return hiringMatch[1].trim();

  // Handle "Title at Company" pattern
  const atMatch = title.match(/^(.+?)\s+(?:at|@)\s+/i);
  if (atMatch) return atMatch[1].trim();

  // Handle "Title - Company" pattern
  const dashMatch = title.match(/^(.+?)\s+[-–]\s+/);
  if (dashMatch) return dashMatch[1].trim();

  return title;
}

function extractTitle($: cheerio.CheerioAPI): string {
  // Try og:title first
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  if (ogTitle) return cleanTitle(ogTitle);

  // Try page title
  const pageTitle = $("title").text();
  if (pageTitle) return cleanTitle(pageTitle);

  // Try common selectors
  return (
    $(".top-card-layout__title").first().text().trim() ||
    $("h1").first().text().trim() ||
    ""
  );
}

function extractCompany($: cheerio.CheerioAPI): string {
  // Try common LinkedIn selectors
  const company =
    $(".topcard__org-name-link").first().text().trim() ||
    $(".top-card-layout__second-subline a").first().text().trim() ||
    $('[data-tracking-control-name="public_jobs_topcard-org-name"]').first().text().trim();

  if (company) return company;

  // Try og:title patterns
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  // "Company hiring Title in Location | LinkedIn"
  const hiringMatch = ogTitle.match(/^(.+?)\s+hiring\s+/i);
  if (hiringMatch) return hiringMatch[1].trim();
  // "Title at Company | LinkedIn"
  const atMatch = ogTitle.match(/\s+(?:at|@)\s+(.+?)(?:\s*\|.*)?$/i);
  if (atMatch) return atMatch[1].trim();

  return "";
}

function extractIndustry($: cheerio.CheerioAPI): string {
  // Try common LinkedIn selectors for industry
  const industry =
    $(".description__job-criteria-text:contains('Industries')").next().text().trim() ||
    $("li:contains('Industries') .description__job-criteria-text").text().trim() ||
    "";
  return industry;
}

function extractLocation($: cheerio.CheerioAPI): string {
  return (
    $(".topcard__flavor--bullet").first().text().trim() ||
    $(".top-card-layout__second-subline .topcard__flavor:last-child").text().trim() ||
    ""
  );
}

function extractSalary($: cheerio.CheerioAPI): {
  min: number | null;
  max: number | null;
} {
  // Look for salary in description text
  const text = $(".description__text, .show-more-less-html__markup").text();
  const match = text.match(
    /[\$€£]\s?([\d,]+)\s*(?:[-–to]+)\s*[\$€£]?\s?([\d,]+)/i
  );
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
  if (ogDesc) {
    // Trim to a reasonable length for notes
    return ogDesc.slice(0, 500);
  }

  const desc = $('meta[name="description"]').attr("content") || "";
  return desc.slice(0, 500);
}

function cleanHtml(html: string): string {
  // Strip HTML tags and clean up whitespace
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
