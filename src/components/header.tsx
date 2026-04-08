"use client";

import { Plus, Upload, Linkedin, LayoutDashboard, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddJobDialog } from "@/components/add-job-dialog";
import { ImportCSVDialog } from "@/components/import-csv-dialog";
import { ImportLinkedInDialog } from "@/components/import-linkedin-dialog";
import { ImportWttjDialog } from "@/components/import-wttj-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/questions", label: "Question Bank", icon: MessageSquare },
];

export function Header() {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [linkedinOpen, setLinkedinOpen] = useState(false);
  const [wttjOpen, setWttjOpen] = useState(false);

  const isDashboard = pathname === "/";

  return (
    <header className="border-b bg-white px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight">Job Hunt OS</h1>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex gap-2">
          {isDashboard && (
            <>
              <Button variant="outline" onClick={() => setLinkedinOpen(true)}>
                <Linkedin className="mr-2 h-4 w-4" />
                Import LinkedIn
              </Button>
              <Button variant="outline" onClick={() => setWttjOpen(true)}>
                Import WTTJ
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </>
          )}
        </div>
      </div>
      <AddJobDialog open={addOpen} onOpenChange={setAddOpen} />
      <ImportCSVDialog open={importOpen} onOpenChange={setImportOpen} />
      <ImportLinkedInDialog open={linkedinOpen} onOpenChange={setLinkedinOpen} />
      <ImportWttjDialog open={wttjOpen} onOpenChange={setWttjOpen} />
    </header>
  );
}
