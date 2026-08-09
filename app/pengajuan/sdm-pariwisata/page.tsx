import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import { PublicSubmissionForm } from "@/components/public/PublicSubmissionForm";

export const metadata = { title: "Pengajuan SDM Pariwisata | APPEKRAF Bangka" };

export default function Page() {
  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <PublicSubmissionForm type="sdm" />
      <PublicSiteFooter />
    </div>
  );
}
