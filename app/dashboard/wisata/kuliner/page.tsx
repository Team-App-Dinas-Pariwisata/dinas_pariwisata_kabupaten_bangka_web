import { DataManager } from "@/components/portal/DataManager";
import { resourceConfigs } from "@/lib/resources";

export const metadata = { title: "Kuliner | Portal SI PARIK BANGKA" };

export default function Page() {
  const config = resourceConfigs.kuliner;
  return (
    <DataManager
      resource="kuliner"
      title="Kuliner"
      description="Kelola usaha kuliner, kategori, menu unggulan, lokasi, kisaran harga, layanan, status halal, media, dan publikasi."
      label="Kuliner"
      fields={config.fields}
      columns={config.columns}
    />
  );
}
