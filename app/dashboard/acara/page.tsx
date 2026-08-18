import { DataManager } from "@/components/portal/DataManager";
import { resourceConfigs } from "@/lib/resources";
export const metadata = { title: "Acara | Portal SI PARIK BANGKA" };
export default function Page() {
  const config = resourceConfigs.acara;
  return <DataManager resource="acara" title="Acara" description="Kelola agenda, kegiatan, festival, dan acara ekonomi kreatif maupun pariwisata." label="Acara" fields={config.fields} columns={config.columns} />;
}
