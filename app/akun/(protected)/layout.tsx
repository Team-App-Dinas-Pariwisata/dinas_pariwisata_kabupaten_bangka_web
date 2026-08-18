import type { ReactNode } from "react";
import { ApplicantShell } from "@/components/applicant/ApplicantShell";
import { requireApplicantPage } from "@/lib/auth";

export default async function ApplicantLayout({ children }: { children: ReactNode }) {
  const user = await requireApplicantPage();
  return (
    <ApplicantShell userName={user.name} userEmail={user.email} avatarUrl={user.avatarUrl}>
      {children}
    </ApplicantShell>
  );
}
