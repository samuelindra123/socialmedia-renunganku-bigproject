## Diagnosis
- Endpoint `POST /posts/:postId/videos` sebelumnya tidak ada → frontend mendapat 404 dan video tidak pernah ditulis ke tabel `PostVideo`.
- Setelah ditambahkan, perlu memastikan:
  1) Route aktif di `PostsController` dengan `FileInterceptor('video')`.
  2) Service `uploadPostVideo` menyimpan ke `PostVideo` via `PrismaService` dan upload file ke storage (SpacesService).
  3) Modul `PostsModule` sudah mengekspor service dan memuat `SpacesModule`.
- Frontend CreatePost sudah:
  - Membuat post (`POST /posts`).
  - Mengunggah video ke `/posts/:postId/videos` lalu fallback `/post-videos`.
  - Melakukan invalidasi cache feed/profile.
- Feed backend sudah `include: { videos: true }`.

## Rencana Perbaikan
1) Backend
- Pastikan dan aktifkan controller route `POST /posts/:postId/videos` dengan `@UseInterceptors(FileInterceptor('video'))` dan parameter `@UploadedFile()`.
- Tambahkan fungsi service `uploadPostVideo(userId, postId, file)`:
  - Validasi post ada dan author cocok.
  - Validasi MIME `video/*`.
  - Upload ke Spaces di folder `videos` dan simpan baris `PostVideo { postId, url }`.
- Tambahkan optional fallback route `POST /post-videos` jika ingin mendukung skema lain.
- Pastikan `PostsModule` punya import `SpacesModule` (sudah ada) dan tidak ada guard yang menghalangi.

2) Frontend
- Pertahankan alur saat ini: `POST /posts` lalu panggil `POST /posts/:postId/videos`.
- Tambahkan notifikasi keberhasilan upload video dari service.
- Pastikan feed memfilter `type === 'video' | 'image' | 'media'` atau ada `videos`.

3) Validasi dan Uji
- Jalankan upload satu video: verifikasi log server `POST /posts/:id/videos 201` dan tabel `PostVideo` bertambah.
- Buka feed/profile: post menampilkan video (array `videos` tersedia).
- Uji kasus gagal: MIME salah, author tidak cocok, koneksi lambat; tampilkan pesan yang benar.

## Output yang akan saya implementasikan
- Menambah dan mengaktifkan route controller upload video.
- Menambah implementasi service upload video yang menyimpan ke `PostVideo`.
- Menambah respons sukses/galat yang eksplisit.
- Meninjau feed agar selalu membawa `videos`.

Silakan konfirmasi agar saya menerapkan perubahan dan melakukan verifikasi end-to-end (unggah → PostVideo terisi → feed/profile menampilkan video).