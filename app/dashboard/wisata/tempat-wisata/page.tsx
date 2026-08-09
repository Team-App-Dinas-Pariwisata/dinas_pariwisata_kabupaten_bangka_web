import { DataManager } from "@/components/portal/DataManager";
import { resourceConfigs } from "@/lib/resources";

export const metadata = { title: "Tempat Wisata | Portal APPEKRAF" };

export default function Page() {
  const config = resourceConfigs["tempat-wisata"];
  return (
    <DataManager
      resource="tempat-wisata"
      title="Tempat Wisata"
      description="Kelola daftar destinasi, informasi lokasi, harga tiket, akses, media, dan status publikasi tempat wisata."
      label="Tempat Wisata"
      fields={config.fields}
      columns={config.columns}
    />
  );
}
