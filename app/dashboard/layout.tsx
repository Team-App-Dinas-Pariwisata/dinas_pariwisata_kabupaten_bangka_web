import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requirePageRole } from "@/lib/auth";
import { checkIsLiveServer } from "@/lib/is-live";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requirePageRole("petugas");
  const isLive = await checkIsLiveServer();
  return <PortalShell role="petugas" userName={user.name} isLiveServer={isLive}>{children}</PortalShell>;
}
