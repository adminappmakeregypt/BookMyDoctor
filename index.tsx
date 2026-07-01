import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import userGuide from "@/assets/User_Guide.pdf.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#fcfbf8" }}
    >
      <a
        href={userGuide.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-8 py-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      >
        <BookOpen className="h-12 w-12 text-primary" />
        <span className="text-lg font-semibold text-foreground">دليل المستخدم</span>
      </a>
    </div>
  );
}
