import { DataManager } from "@/components/portal/DataManager";
import { resourceConfigs } from "@/lib/resources";
export const metadata = { title: "Berita | Portal APPEKRAF" };
export default function Page() {
  const config = resourceConfigs.berita;
  return <DataManager resource="berita" title="Berita" description="Kelola berita dan publikasi APPEKRAF Kabupaten Bangka." label="Berita" fields={config.fields} columns={config.columns} />;
}
