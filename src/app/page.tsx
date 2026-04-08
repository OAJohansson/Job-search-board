import { getJobsByStatus } from "@/lib/actions";
import { KanbanBoard } from "@/components/kanban-board";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const boardData = await getJobsByStatus();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <KanbanBoard initialData={boardData} />
      </main>
    </div>
  );
}
