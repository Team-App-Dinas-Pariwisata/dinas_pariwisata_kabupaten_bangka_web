import { notFound } from "next/navigation";
import { ApplicantSubmissionForm } from "@/components/applicant/ApplicantSubmissionForm";
import { requireApplicantPage } from "@/lib/auth";

export const metadata = { title: "Edit Pengajuan Komunitas | Akun SI PARIK BANGKA" };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const user = await requireApplicantPage();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ApplicantSubmissionForm type="komunitas" userName={user.name} userEmail={user.email} submissionId={id} />;
}
