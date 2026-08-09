import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requirePageRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requirePageRole("admin");
  return <PortalShell role="admin" userName={user.name}>{children}</PortalShell>;
}
