# Petualangan Angka — Panduan Build Android di Windows (Expo EAS)

Proyek ini adalah aplikasi **Expo + React Native + TypeScript** yang berjalan **100% offline**.
Seluruh gameplay dan data (profil pemain, progres, highscore) disimpan di perangkat memakai
**SQLite lokal** (`expo-sqlite`). Tidak ada FastAPI, MongoDB, URL preview, atau layanan Emergent
yang dibutuhkan saat aplikasi berjalan.

> Catatan: file `src/db/database.web.ts` adalah **cadangan localStorage khusus pratinjau web** dan
> tidak dipakai di build Android. Di Android, `src/db/database.ts` (SQLite asli) yang dipakai.
> Metro memilih file yang tepat secara otomatis per-platform.

---

## 0) Yang sudah terpasang di laptop Anda
- Node.js v24.15.0, npm, Git.
- **Expo EAS CLI 24.10.0** (lewat Codex). Panduan ini **tidak** menyuruh Anda memasang ulang EAS.
- Anda memakai **akun Expo sendiri** (paket Free).

Tidak ada environment variable yang diperlukan untuk build. Aplikasi tidak membaca `.env` apa pun.

---

## 1) Ekstrak ZIP
Ekstrak `petualangan-angka.zip`. Anda akan mendapat satu folder:

```
petualangan-angka\
```

Semua perintah di bawah dijalankan **DI DALAM folder `petualangan-angka`**
(folder yang berisi `package.json`, `app.json`, dan `eas.json`).

Buka terminal di sana, contoh:
```
cd C:\Users\<nama-anda>\Downloads\petualangan-angka
```

---

## 2) Pasang dependensi (memakai Yarn — sesuai lockfile proyek)
Proyek ini memakai **Yarn Classic (1.22)** dan menyertakan `yarn.lock`. Jalankan **satu** perintah ini:

```
yarn install
```

(Jangan pakai `npm install` agar versi dependensi tetap sama persis dengan `yarn.lock`.)

---

## 3) Gunakan terminal EAS yang sudah disiapkan Codex
Buka terminal tempat `eas` sudah tersedia. Pastikan CLI terbaca:

```
eas --version
```
Harus menampilkan `24.10.0` (atau lebih baru).

---

## 4) Periksa / lakukan login Expo
Cek status login:
```
eas whoami
```
- Jika muncul **username Expo Anda**, berarti sudah login — lanjut ke langkah 5.
- Jika muncul pesan *Not logged in*, login lewat browser:
```
eas login --browser
```
Selesaikan login di browser, lalu ulangi `eas whoami` untuk memastikan.

---

## 5) Hubungkan proyek ke akun Expo Anda
Proyek ini **belum terikat** ke akun/proyek Expo mana pun:
- `app.json` **tidak** memiliki `owner`.
- `app.json` **tidak** memiliki `extra.eas.projectId`.

Jadi tidak ada kredensial milik orang lain yang ikut terbawa. Saat pertama kali menautkan, jalankan:

```
eas init
```
- Pilih akun/organisasi = **akun Expo Anda sendiri**.
- EAS akan membuat proyek baru dan **otomatis menuliskan** `extra.eas.projectId` ke `app.json`.
- Jika ditanya membuat proyek baru dengan slug `petualangan-angka`, jawab **Yes**.

> Jika suatu saat `app.json` sudah berisi `extra.eas.projectId` atau `owner` milik akun lain,
> hapus kedua field itu lalu jalankan `eas init` kembali agar tertaut ke akun Anda.

---

## 6) Build satu APK (profil `preview`)
`eas.json` sudah menyediakan profil `preview` khusus APK
(`distribution: internal`, `developmentClient: false`, `android.buildType: apk`). Jalankan:

```
eas build --platform android --profile preview
```

Saat diminta soal **keystore** (aplikasi baru):
- Pilih **"Generate a new Android Keystore"** (biarkan EAS yang mengelola). Jawab **Yes**.
- Keystore disimpan aman di akun Expo Anda; Anda tidak perlu membuatnya manual.

Build berjalan di server EAS (gratis pada paket Free, mungkin antre beberapa menit).

---

## 7) Unduh APK
Setelah selesai, terminal menampilkan **link halaman build**. Buka link itu
(atau buka https://expo.dev → proyek Anda → **Builds**), lalu klik **Download** untuk mengambil file `.apk`.

---

## 8) Pasang APK di HP Android
1. Pindahkan file `.apk` ke HP (kabel USB / Google Drive / kirim ke diri sendiri).
2. Di HP, buka file `.apk`.
3. Jika diminta, aktifkan **"Install from unknown sources"** untuk aplikasi pembuka tersebut.
4. Selesaikan pemasangan. Ikon **Petualangan Angka** akan muncul di layar aplikasi.

---

## 9) Uji dalam mode pesawat (bukti offline)
1. Aktifkan **Mode Pesawat** di HP.
2. Buka **Petualangan Angka** langsung dari ikonnya (tanpa Expo Go / tanpa server / tanpa PC).
3. Tab **Pemain** → tambah 1–2 pemain.
4. **Beranda** → pilih operasi, tingkat, mode → **Mulai Bermain** (coba Latihan dan Tantangan 60 detik).
5. **Highscore** → pastikan skor sesi Tantangan yang selesai muncul.
6. Tutup aplikasi lalu buka lagi → pastikan pemain, progres, dan highscore **masih tersimpan**.

Semua harus berfungsi penuh tanpa koneksi internet.

---

## Ringkasan perintah (urut)
```
cd petualangan-angka
yarn install
eas whoami
eas login --browser        # hanya jika belum login
eas init                   # tautkan ke akun Expo Anda (menulis extra.eas.projectId)
eas build --platform android --profile preview
```

## Catatan konfigurasi
- **Nama aplikasi:** `Petualangan Angka` (`app.json` → `expo.name`).
- **Package Android:** `com.emergent.angkaadventure.yzek4q` (dipertahankan dari proyek).
  Ganti **hanya jika** Anda benar-benar butuh package lain; jika diganti, pastikan unik
  dan konsisten (format `com.perusahaan.namaapp`).
- **Ikon & splash:** ada di `assets/images/` (`icon.png`, `adaptive-icon.png`, `splash-image.png`).
- **Font:** `assets/fonts/SpaceMono-Regular.ttf` disertakan.
- **Environment variables:** tidak ada yang diperlukan untuk build.
- **Folder `android/` native:** tidak disertakan dan tidak diperlukan — ini proyek Expo *managed*,
  EAS menjalankan prebuild otomatis saat build.
