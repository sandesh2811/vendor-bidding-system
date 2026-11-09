import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { LinkButton } from "./link-button";

/* top bar plus page title block shared by admin pages */
export function PageHeader({
  section,
  title,
  description,
  actions,
  badge,
  back,
}: {
  section: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /* shown beside the title, e.g. a status */
  badge?: ReactNode;
  /* parent page, for a back arrow before the title */
  back?: { href: string; label: string };
}) {
  return (
    <>
      <AdminTopBar section={section} />
      <PageTitle title={title} description={description} actions={actions} badge={badge} back={back} />
    </>
  );
}

/* sidebar toggle and section name; rendered on its own while a page's data (and so its title) loads */
export function AdminTopBar({ section }: { section: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-vertical:h-4" />
      <span className="text-sm text-muted-foreground">{section}</span>
    </header>
  );
}

/* the title block alone, under an AdminTopBar or in the vendor portal */
export function PageTitle({
  title,
  description,
  actions,
  badge,
  back,
  className = "px-4 pt-8 pb-6 md:px-10",
}: Omit<Parameters<typeof PageHeader>[0], "section"> & { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-2">
        {back && (
          <LinkButton href={back.href} variant="ghost" size="icon-sm" aria-label={back.label} className="mt-0.5 -ml-2">
            <ArrowLeftIcon />
          </LinkButton>
        )}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold break-words">{title}</h1>
            {badge}
          </div>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
