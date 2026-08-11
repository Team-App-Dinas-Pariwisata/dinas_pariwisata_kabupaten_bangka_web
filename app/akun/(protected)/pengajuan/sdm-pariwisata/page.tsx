import { ApplicantSubmissionForm } from "@/components/applicant/ApplicantSubmissionForm";
import { requireApplicantPage } from "@/lib/auth";
export const metadata = { title: "Pengajuan SDM Pariwisata | Akun SI PARIK BANGKA" };
export default async function Page() { const user = await requireApplicantPage(); return <ApplicantSubmissionForm type="sdm" userName={user.name} userEmail={user.email} />; }
