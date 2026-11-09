"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { meQuery } from "@/lib/api";
import { vendorProfileQuery } from "../../api/vendor-portal.api";
import { CATEGORY_LABELS } from "../../constants";
import { VendorStatusBadge } from "../shared/vendor-status-badge";
import { EditProfileSheet } from "./edit-profile-sheet";

/* the vendor's details; it can edit its business details, while emails, password and category stay with Mero Event */
export function VendorProfileView() {
  const query = useQuery(vendorProfileQuery);
  const { data: user } = useQuery(meQuery);
  const [editing, setEditing] = useState(false);

  return (
    <QueryBoundary
      query={query}
      errorTitle="Couldn't load your profile"
      fallback={<Skeleton className="h-64 w-full" />}
    >
      {(vendor) => {
        const facts = [
          ["Category", CATEGORY_LABELS[vendor.category]],
          ["Phone", vendor.phone],
          ["Contact person", vendor.contactName],
          ["Business email", vendor.email],
          ["Address", vendor.address],
          ["Login email", user?.email],
        ] as const;

        return (
          <>
            <PageTitle
              title={vendor.name}
              badge={<VendorStatusBadge isActive={vendor.isActive} />}
              description="Your details as Mero Event sees them. Contact Mero Event to change your emails, password or category."
              actions={
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <PencilIcon data-icon="inline-start" />
                  Edit profile
                </Button>
              }
              className="px-0 pt-0 pb-6"
            />
            <SectionCard title="Profile">
              <dl className="grid gap-5 sm:grid-cols-2">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium break-words">{value || <span className="font-normal text-muted-foreground">Not added</span>}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
            <EditProfileSheet vendor={vendor} open={editing} onOpenChange={setEditing} />
          </>
        );
      }}
    </QueryBoundary>
  );
}
