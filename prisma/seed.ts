import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const jobs = [
  {
    title: "Frontend Developer",
    company: "Spotify",
    location: "Stockholm, Sweden",
    url: "https://jobs.spotify.com/frontend-dev",
    notes: "Great culture, music industry",
    status: "Saved",
    position: 0,
  },
  {
    title: "Full Stack Engineer",
    company: "Klarna",
    location: "Stockholm, Sweden",
    url: "https://klarna.com/careers/full-stack",
    notes: "Fintech, good benefits",
    status: "Saved",
    position: 1,
  },
  {
    title: "React Developer",
    company: "Ubisoft",
    location: "Malmö, Sweden",
    url: "https://ubisoft.com/careers/react",
    notes: "Gaming industry, hybrid work",
    status: "Applied",
    position: 0,
    dateApplied: new Date("2026-02-10"),
  },
  {
    title: "Software Engineer",
    company: "Ericsson",
    location: "Linköping, Sweden",
    url: "https://ericsson.com/careers/swe",
    notes: "Telecom, stable company",
    status: "Applied",
    position: 1,
    dateApplied: new Date("2026-02-05"),
  },
  {
    title: "TypeScript Developer",
    company: "King",
    location: "Stockholm, Sweden",
    url: "https://king.com/careers/ts-dev",
    notes: "Candy Crush company, fun environment",
    status: "Interviewing",
    position: 0,
    dateApplied: new Date("2026-01-20"),
  },
  {
    title: "Senior Frontend Engineer",
    company: "H&M Group",
    location: "Stockholm, Sweden",
    url: "https://hmgroup.com/careers/frontend",
    notes: "E-commerce, large scale",
    status: "Interviewing",
    position: 1,
    dateApplied: new Date("2026-01-25"),
  },
  {
    title: "Web Developer",
    company: "IKEA",
    location: "Älmhult, Sweden",
    url: "https://ikea.com/careers/web-dev",
    notes: "Would need to relocate",
    status: "Offer",
    position: 0,
    dateApplied: new Date("2026-01-10"),
  },
  {
    title: "Frontend Engineer",
    company: "Northvolt",
    location: "Stockholm, Sweden",
    url: "https://northvolt.com/careers/fe",
    notes: "Green energy, interesting mission",
    status: "Rejected",
    position: 0,
    dateApplied: new Date("2026-01-15"),
  },
];

const categories = [
  "Product Sense & Design",
  "Metrics & Analytics",
  "Execution & Prioritization",
  "Behavioral & Leadership",
  "Strategy & Vision",
  "Technical Fluency / Data Science",
  "Clinical Safety & Compliance",
];

async function main() {
  console.log("Seeding database...");

  await prisma.job.deleteMany();

  for (const job of jobs) {
    await prisma.job.create({ data: job });
  }

  console.log(`Seeded ${jobs.length} jobs.`);

  // Seed categories (upsert to avoid duplicates on re-run)
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
