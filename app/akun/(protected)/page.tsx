import { ApplicantOverview } from "@/components/applicant/ApplicantOverview";
import { requireApplicantPage } from "@/lib/auth";

export const metadata = { title: "Akun Pengaju | SI PARIK BANGKA" };

export default async function ApplicantPage() {
  const user = await requireApplicantPage();
  return <ApplicantOverview userId={user.id} userName={user.name} />;
}
