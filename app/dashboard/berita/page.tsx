import { DataManager } from "@/components/portal/DataManager";
import { resourceConfigs } from "@/lib/resources";
export const metadata = { title: "Berita | Portal SI PARIK BANGKA" };
export default function Page() {
  const config = resourceConfigs.berita;
  return <DataManager resource="berita" title="Berita" description="Kelola berita dan publikasi SI PARIK BANGKA Kabupaten Bangka." label="Berita" fields={config.fields} columns={config.columns} />;
}
