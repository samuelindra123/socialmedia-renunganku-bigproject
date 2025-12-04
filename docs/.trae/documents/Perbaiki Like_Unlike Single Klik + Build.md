## Diagnosis Cepat
- Penyebab utama: `currentUserId` tidak tersedia di endpoint feed sehingga `isLiked` selalu `false` setelah refresh; ini membuat seolah perlu klik dua kali.
  - Referensi: `backend/src/posts/posts.controller.ts:39-43` (sebelumnya `@Public()`), `backend/src/posts/posts.service.ts:212-217` (include likes ketika `currentUserId` ada), `backend/src/posts/posts.service.ts:288-316` (hitung `isLiked`).
- Potensi race di frontend: klik beruntun saat request pending dan invalidasi cache menyebabkan status ter-flip.
  - Referensi: `frontend/src/components/feed/PostCard.tsx:248-281` (mutasi like), `239-246` (sinkron jumlah dari server).

## Perbaikan Backend
- Pastikan feed terproteksi (`JwtAuthGuard`) agar `@GetUser('id')` terisi.
  - Tinjau `backend/src/posts/posts.controller.ts:39-43` dan hapus `@Public()` jika masih ada.
- Validasi idempoten like/unlike:
  - `backend/src/likes/likes.service.ts:18-26` (cek existing like) dan `48-64` (unlike) sudah benar.
- Pastikan feed menyertakan `_count.likes` dan filter `likes/bookmarks` untuk user aktif (sudah di `posts.service.ts:209-223`).

## Perbaikan Frontend
- Tambah guard untuk mencegah klik saat request pending dan terapkan optimistic update yang konsisten lintas daftar:
  - Implementasi di `frontend/src/components/feed/PostCard.tsx`:
    - Guard klik: handler memeriksa `likeMutation.isPending`.
    - `applyCacheUpdate` memperbarui `feed`, `discover` (infinite), dan `user-posts` secara atomik.
    - Sinkronisasi jumlah dari server via `GET /likes/posts/:postId?limit=1` memastikan akurasi.
- Stabilitas UI:
  - Animasi burst singkat pada ikon hati tanpa mengubah layout (efek skala ringan).
- Error handling:
  - Rollback state saat failure dan tampilkan toast error.

## Build & Verifikasi Manual
- Setelah saya terapkan perbaikan:
  - Jalankan build backend: `cd backend && npm run build`.
  - Jalankan build frontend: `cd frontend && npm run build`.
- Langkah uji manual (tanpa alat test otomatis):
  - Login → buka `/feed` → klik like satu kali: ikon hati jadi merah, angka bertambah.
  - Refresh halaman: `isLiked` tetap true; angka konsisten.
  - Klik unlike satu kali: kembali normal; refresh tetap konsisten.
  - Uji di Discover modal dan halaman profil: status/angka sama tanpa flicker.

## Catatan Teknis
- Jika feed perlu tetap publik untuk pengunjung anonim, saya bisa menambahkan fallback: membaca token dari header bila ada untuk menghitung `isLiked` tanpa mengubah akses publik.

Konfirmasi untuk lanjut eksekusi: saya akan melakukan perubahan (jika ada sisa), lalu menjalankan `npm run build` untuk backend dan frontend, dan melaporkan hasil build serta panduan uji manual singkat.