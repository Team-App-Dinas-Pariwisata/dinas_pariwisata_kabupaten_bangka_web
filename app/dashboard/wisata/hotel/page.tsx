import { DataManager } from "@/components/portal/DataManager";
import { resourceConfigs } from "@/lib/resources";

export const metadata = { title: "Hotel | Portal SI PARIK BANGKA" };

export default function Page() {
  const config = resourceConfigs.hotel;
  return (
    <DataManager
      resource="hotel"
      title="Hotel"
      description="Kelola data hotel dan akomodasi, lokasi, kontak, jam check-in/check-out, harga, media, dan publikasi."
      label="Hotel"
      fields={config.fields}
      columns={config.columns}
    />
  );
}
