import { DataManager } from "@/components/portal/DataManager";
import { resourceConfigs } from "@/lib/resources";

export const metadata = { title: "Satwa Endemik | Portal SI PARIK BANGKA" };

export default function Page() {
  const config = resourceConfigs["satwa-endemik"];
  return (
    <DataManager
      resource="satwa-endemik"
      title="Satwa Endemik"
      description="Kelola identitas, taksonomi, status konservasi, habitat, persebaran, informasi edukasi, media, dan publikasi satwa endemik."
      label="Satwa Endemik"
      fields={config.fields}
      columns={config.columns}
    />
  );
}
