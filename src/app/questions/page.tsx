import { getCategories, getQuestions } from "@/lib/question-actions";
import { QuestionBank } from "@/components/question-bank";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const [categories, questions] = await Promise.all([
    getCategories(),
    getQuestions(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <QuestionBank initialQuestions={questions} categories={categories} />
      </main>
    </div>
  );
}
