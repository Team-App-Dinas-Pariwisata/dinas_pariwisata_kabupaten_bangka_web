import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requirePageRole } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requirePageRole("pengguna");
  return <PortalShell role="pengguna" userName={user.name}>{children}</PortalShell>;
}
