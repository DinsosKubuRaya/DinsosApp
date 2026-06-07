# ArsipApp Aplikasi Mobile Dinsos Kubu Raya

> Aplikasi mobile lintas platform untuk Dinas Sosial Kabupaten Kubu Raya, dibangun menggunakan React Native dengan Expo, TypeScript, dan Expo Router berbasis file-based routing.

---

## Tentang Proyek

ArsipApp adalah aplikasi mobile Android (dan iOS) untuk mendukung operasional digital Dinas Sosial Kabupaten Kubu Raya. Aplikasi ini memungkinkan staf dan admin mengelola dokumen, menerima notifikasi real-time, melakukan disposisi surat, serta mengakses data arsip kantor langsung dari perangkat mobile.

Aplikasi ini terhubung ke [DinsosBackend](https://github.com/DinsosKubuRaya/DinsosBackend) melalui REST API dan WebSocket, menggunakan Firebase Cloud Messaging untuk push notification, serta dibangun di atas **React Native New Architecture** untuk performa yang lebih baik.

---

## Fitur & Layar

| Fitur | Deskripsi |
|---|---|
| **Login** | Autentikasi pengguna dengan penyimpanan token aman via SecureStore |
| **Dashboard** | Ringkasan dan navigasi utama aplikasi |
| **Dokumen** | Lihat, unggah, dan kelola dokumen masuk (PDF & gambar) |
| **Dokumen Staf** | Dokumen yang dikirim atau dimiliki oleh staf |
| **Disposisi** | Disposisi dokumen dari admin ke satu atau beberapa staf |
| **Notifikasi** | Penerimaan push notification & notifikasi real-time via WebSocket |
| **Log Aktivitas** | Riwayat aktivitas pengguna di dalam aplikasi |
| **Pemilih File** | Upload dokumen langsung dari perangkat (PDF & gambar) |

---

## Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| [React Native](https://reactnative.dev) | 0.81.5 | Framework mobile |
| [Expo](https://expo.dev) | ~54.0.27 | Platform & toolchain |
| [TypeScript](https://typescriptlang.org) | ~5.9.2 | Type safety |
| [Expo Router](https://expo.github.io/router) | ~6.0.17 | File-based routing |
| [React Navigation](https://reactnavigation.org) | ^7.x | Navigasi & bottom tabs |
| [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) | ~0.32.14 | Push notification |
| [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/) | ~15.0.8 | Penyimpanan token yang aman |
| [Expo Document Picker](https://docs.expo.dev/versions/latest/sdk/document-picker/) | ~14.0.8 | Pemilih file dokumen |
| [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | ~17.0.9 | Pemilih gambar dari galeri/kamera |
| [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/) | ~3.0.11 | Komponen gambar berperforma tinggi |
| [React Native WebView](https://github.com/react-native-webview/react-native-webview) | 13.15.0 | Tampilan dokumen PDF dalam aplikasi |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | ~4.1.1 | Animasi berperforma tinggi |
| [Firebase (Google Services)](https://firebase.google.com) | — | Push notification via FCM |
| [EAS Build](https://docs.expo.dev/build/introduction/) | — | Build & distribusi APK |

---

## Struktur Proyek

```
DinsosApp/
├── app/                  # Layar & routing (file-based via Expo Router)
│   ├── (auth)/           # Layar autentikasi (login)
│   ├── (tabs)/           # Navigasi tab utama
│   └── ...               # Layar lainnya
├── assets/               # Gambar, ikon, splash screen
├── components/           # Komponen UI yang dapat digunakan ulang
├── config/               # Konfigurasi API dan konstanta
├── constants/            # Warna, ukuran, dan konstanta global
├── hooks/                # Custom React hooks
├── scripts/              # Script utilitas (reset project, dll)
├── utils/                # Fungsi utilitas (token, format, dll)
├── app.json              # Konfigurasi Expo
├── eas.json              # Konfigurasi EAS Build
├── google-services.json  # Konfigurasi Firebase (FCM)
├── tsconfig.json
└── package.json
```

---

## Konfigurasi Aplikasi

| Properti | Nilai |
|---|---|
| Nama Aplikasi | ArsipApp |
| Android Package | `com.dinsos.arsipapp` |
| Orientasi | Portrait |
| New Architecture | Aktif (`newArchEnabled: true`) |
| Notifikasi Channel | `high-priority` |
| Target Platform | Android (utama), iOS, Web |

---

## Environment & Konfigurasi

Sesuaikan URL backend di folder `config/`:

```ts
// config/api.ts (atau sejenisnya)
export const API_URL = "https://your-backend-url.com/api";
export const WS_URL = "wss://your-backend-url.com/api/ws";
```

Pastikan file `google-services.json` sudah terisi dengan konfigurasi Firebase project yang valid sebelum melakukan build.

---

## Memulai (Development)

### Prasyarat

- Node.js >= 18
- npm atau yarn
- [Expo Go](https://expo.dev/go) di perangkat Android/iOS (untuk development cepat)
- Atau Android Studio / Xcode untuk emulator

### Instalasi

```bash
# Clone repository
git clone https://github.com/DinsosKubuRaya/DinsosApp.git
cd DinsosApp

# Install dependensi
npm install
```

### Menjalankan Aplikasi

```bash
# Jalankan development server
npx expo start
```

Setelah server berjalan, pilih salah satu opsi:

- Tekan `a` untuk membuka di Android emulator
- Tekan `i` untuk membuka di iOS simulator
- Scan QR code dengan Expo Go di perangkat fisik

---

## Build APK dengan EAS

Proyek ini menggunakan **Expo Application Services (EAS)** untuk proses build.

```bash
# Install EAS CLI (jika belum)
npm install -g eas-cli

# Login ke akun Expo
eas login

# Build APK untuk development (testing internal)
eas build --profile development --platform android

# Build APK untuk preview (distribusi internal)
eas build --profile preview --platform android

# Build APK untuk production (distribusi store)
eas build --profile production --platform android
```

| Profile | Distribusi | Output |
|---|---|---|
| `development` | Internal | APK + Dev Client |
| `preview` | Internal | APK |
| `production` | Store | APK |

---

## Koneksi ke Backend

Aplikasi ini adalah bagian dari ekosistem digital Dinas Sosial Kubu Raya. Pastikan backend API sudah berjalan sebelum menjalankan aplikasi.

| Komponen | Repository |
|---|---|
| **Backend API** | [DinsosBackend](https://github.com/DinsosKubuRaya/DinsosBackend) |
| **Aplikasi Mobile** | Repo ini |

---

## Deployment

Distribusi APK dilakukan melalui EAS Build. Setelah build selesai, APK dapat didistribusikan secara internal atau diunggah ke Google Play Store melalui dashboard EAS.
