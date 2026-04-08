export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type { Job } from "@/generated/prisma/client";

export type BoardData = Record<
  JobStatus,
  import("@/generated/prisma/client").Job[]
>;
