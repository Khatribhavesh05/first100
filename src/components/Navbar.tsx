import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-primary">◎</span>
          <span>FounderScope</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/analyze" className="hover:text-foreground transition-colors">Analyze</Link>
          <Link href="/research" className="hover:text-foreground transition-colors">Research</Link>
          <Link href="/strategy" className="hover:text-foreground transition-colors">Strategy</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/research" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}>
            Sample Report
          </Link>
          <Link href="/analyze" className={cn(buttonVariants({ size: "sm" }))}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
