import { ApplicantSubmissionForm } from "@/components/applicant/ApplicantSubmissionForm";
import { requireApplicantPage } from "@/lib/auth";
export const metadata = { title: "Pengajuan Pelaku Ekraf | Akun SI PARIK BANGKA" };
export default async function Page() { const user = await requireApplicantPage(); return <ApplicantSubmissionForm type="ekraf" userName={user.name} userEmail={user.email} />; }
