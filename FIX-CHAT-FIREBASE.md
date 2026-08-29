# Perbaikan Chat Firebase Realtime Database

Perbaikan ini menangani crash dashboard petugas dengan error:

`Cannot read properties of undefined (reading 'replace')`

Penyebabnya adalah Firebase Realtime Database dapat mengembalikan node dengan key numerik sebagai Array. Index yang tidak memiliki data muncul sebagai slot `null`. Implementasi `getAll()` sebelumnya mengubah slot kosong tersebut menjadi record palsu seperti `{ id: 0 }` atau `{ id: 2 }`.

Perubahan:

- `lib/realtime-db.ts`: slot `null`/`undefined` Firebase tidak lagi diproses sebagai record.
- `app/api/chat/staff/route.ts`: conversation dan message divalidasi serta dinormalisasi sebelum dikirim ke browser.
- `components/portal/StaffFloatingChat.tsx`: rendering chat dibuat aman terhadap nilai kosong/tidak lengkap.
- `components/portal/SupportChatManager.tsx`: halaman chat penuh memakai normalisasi defensif yang sama.
- Response GET chat staff memakai `Cache-Control: no-store`.

Setelah deploy, endpoint `/api/chat/staff` tidak lagi seharusnya mengembalikan record kosong seperti `{"id":0}` atau `{"id":2}`.
