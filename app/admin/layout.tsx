import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requirePageRole } from "@/lib/auth";
import { checkIsLiveServer } from "@/lib/is-live";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requirePageRole("admin");
  const isLive = await checkIsLiveServer();
  return <PortalShell role="admin" userName={user.name} isLiveServer={isLive}>{children}</PortalShell>;
}
