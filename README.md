# ElysiaJS + Drizzle ORM + MySQL Starter (Bun)

Project backend API menggunakan Bun, ElysiaJS, Drizzle ORM, dan MySQL.

## Tech Stack
- **Runtime:** [Bun](https://bun.sh)
- **Web Framework:** [ElysiaJS](https://elysiajs.com)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Database:** MySQL (menggunakan `mysql2`)

---

## Memulai (Getting Started)

### 1. Instalasi Dependencies
```bash
bun install
```

### 2. Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env` dan sesuaikan koneksi database Anda:
```bash
cp .env.example .env
```
Contoh isi `.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/belajar_vibe_coding"
PORT=3000
```

### 3. Database Migration / Sync
- **Generate Migrations:**
  ```bash
  bun run db:generate
  ```
- **Push Schema langsung ke Database:**
  ```bash
  bun run db:push
  ```
- **Buka Drizzle Studio (Database GUI):**
  ```bash
  bun run db:studio
  ```

### 4. Menjalankan Server
- Mode Development (dengan hot-reload):
  ```bash
  bun run dev
  ```
- Mode Production:
  ```bash
  bun run start
  ```

---

## Endpoints Tersedia
- `GET /` - Welcome message & server status
- `GET /health` - Health check & uptime
- `GET /users` - Mengambil daftar user dari database
- `POST /users` - Menambahkan user baru (Body: `{ "name": "...", "email": "..." }`)
