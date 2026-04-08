"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getQuestions(categoryId?: string) {
  return prisma.question.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createQuestion(formData: FormData) {
  const text = formData.get("text") as string;
  const categoryId = formData.get("categoryId") as string;
  const answer = (formData.get("answer") as string) || "";
  const confidence = Number(formData.get("confidence")) || 1;

  if (!text || !categoryId) {
    throw new Error("Question text and category are required");
  }

  const question = await prisma.question.create({
    data: {
      text,
      categoryId,
      answer,
      confidence: Math.min(5, Math.max(1, confidence)),
    },
  });

  revalidatePath("/questions");
  return question;
}

export async function updateQuestion(id: string, formData: FormData) {
  const text = formData.get("text") as string;
  const categoryId = formData.get("categoryId") as string;
  const answer = (formData.get("answer") as string) || "";
  const confidence = Number(formData.get("confidence")) || 1;

  if (!text || !categoryId) {
    throw new Error("Question text and category are required");
  }

  const question = await prisma.question.update({
    where: { id },
    data: {
      text,
      categoryId,
      answer,
      confidence: Math.min(5, Math.max(1, confidence)),
    },
  });

  revalidatePath("/questions");
  return question;
}

export async function deleteQuestion(id: string) {
  await prisma.question.delete({ where: { id } });
  revalidatePath("/questions");
}
