"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { type JobStatus, JOB_STATUSES, type BoardData } from "@/lib/types";

export async function getJobsByStatus(): Promise<BoardData> {
  const jobs = await prisma.job.findMany({
    orderBy: { position: "asc" },
  });

  const board = Object.fromEntries(
    JOB_STATUSES.map((status) => [status, [] as typeof jobs])
  ) as BoardData;

  for (const job of jobs) {
    const status = job.status as JobStatus;
    if (board[status]) {
      board[status].push(job);
    }
  }

  return board;
}

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  const company = formData.get("company") as string;
  const location = (formData.get("location") as string) || "";
  const industry = (formData.get("industry") as string) || "";
  const url = (formData.get("url") as string) || "";
  const notes = (formData.get("notes") as string) || "";
  const salaryMin = formData.get("salaryMin")
    ? Number(formData.get("salaryMin"))
    : null;
  const salaryMax = formData.get("salaryMax")
    ? Number(formData.get("salaryMax"))
    : null;

  if (!title || !company) {
    throw new Error("Title and company are required");
  }

  const maxPosition = await prisma.job.aggregate({
    where: { status: "Saved" },
    _max: { position: true },
  });

  const job = await prisma.job.create({
    data: {
      title,
      company,
      location,
      industry,
      url,
      notes,
      salaryMin,
      salaryMax,
      status: "Saved",
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  revalidatePath("/");
  return job;
}

export async function updateJob(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const company = formData.get("company") as string;
  const location = (formData.get("location") as string) || "";
  const industry = (formData.get("industry") as string) || "";
  const url = (formData.get("url") as string) || "";
  const notes = (formData.get("notes") as string) || "";
  const salaryMin = formData.get("salaryMin")
    ? Number(formData.get("salaryMin"))
    : null;
  const salaryMax = formData.get("salaryMax")
    ? Number(formData.get("salaryMax"))
    : null;

  if (!title || !company) {
    throw new Error("Title and company are required");
  }

  const job = await prisma.job.update({
    where: { id },
    data: {
      title,
      company,
      location,
      industry,
      url,
      notes,
      salaryMin,
      salaryMax,
    },
  });

  revalidatePath("/");
  return job;
}

export async function updateJobStatus(
  id: string,
  newStatus: JobStatus,
  newPosition: number
) {
  if (!JOB_STATUSES.includes(newStatus)) {
    throw new Error("Invalid status");
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new Error("Job not found");

  const oldStatus = job.status;
  const oldPosition = job.position;

  // Close the gap in the source column
  if (oldStatus !== newStatus) {
    await prisma.job.updateMany({
      where: {
        status: oldStatus,
        position: { gt: oldPosition },
        id: { not: id },
      },
      data: {
        position: { decrement: 1 },
      },
    });
  }

  // Shift positions of other jobs in the target column to make room
  await prisma.job.updateMany({
    where: {
      status: newStatus,
      position: { gte: newPosition },
      id: { not: id },
    },
    data: {
      position: { increment: 1 },
    },
  });

  // Update the moved job
  await prisma.job.update({
    where: { id },
    data: {
      status: newStatus,
      position: newPosition,
      dateApplied:
        newStatus === "Applied" && !job.dateApplied ? new Date() : job.dateApplied,
    },
  });

  revalidatePath("/");
}

export async function reorderJob(id: string, newPosition: number) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new Error("Job not found");

  const oldPosition = job.position;

  if (oldPosition === newPosition) return;

  if (newPosition > oldPosition) {
    // Moving down: shift items between old and new position up
    await prisma.job.updateMany({
      where: {
        status: job.status,
        position: { gt: oldPosition, lte: newPosition },
        id: { not: id },
      },
      data: { position: { decrement: 1 } },
    });
  } else {
    // Moving up: shift items between new and old position down
    await prisma.job.updateMany({
      where: {
        status: job.status,
        position: { gte: newPosition, lt: oldPosition },
        id: { not: id },
      },
      data: { position: { increment: 1 } },
    });
  }

  await prisma.job.update({
    where: { id },
    data: { position: newPosition },
  });

  revalidatePath("/");
}

export async function deleteJob(id: string) {
  await prisma.job.delete({ where: { id } });
  revalidatePath("/");
}

interface ImportJobRow {
  title: string;
  company: string;
  location?: string;
  industry?: string;
  url?: string;
  notes?: string;
  status: string;
  dateApplied?: string | null;
}

function mapImportStatus(outcome: string): JobStatus {
  const lower = outcome.toLowerCase().trim();
  if (lower === "not successful" || lower === "rejected") return "Rejected";
  if (lower === "offer") return "Offer";
  if (lower === "interviewing" || lower === "interview") return "Interviewing";
  if (lower === "applied") return "Applied";
  return "Saved";
}

export async function importJobs(rows: ImportJobRow[]) {
  // Get current max positions per status
  const existingJobs = await prisma.job.findMany({
    select: { status: true, position: true },
  });

  const maxPositions: Record<string, number> = {};
  for (const job of existingJobs) {
    const current = maxPositions[job.status] ?? -1;
    if (job.position > current) maxPositions[job.status] = job.position;
  }

  let imported = 0;

  for (const row of rows) {
    if (!row.title || !row.company) continue;

    const status = mapImportStatus(row.status);
    maxPositions[status] = (maxPositions[status] ?? -1) + 1;

    let dateApplied: Date | null = null;
    if (row.dateApplied) {
      const parsed = new Date(row.dateApplied);
      if (!isNaN(parsed.getTime())) dateApplied = parsed;
    }

    await prisma.job.create({
      data: {
        title: row.title.trim(),
        company: row.company.trim(),
        location: row.location?.trim() || "",
        industry: row.industry?.trim() || "",
        url: row.url?.trim() || "",
        notes: row.notes?.trim() || "",
        status,
        position: maxPositions[status],
        dateApplied,
      },
    });

    imported++;
  }

  revalidatePath("/");
  return { imported };
}
