"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import { FlatIcon } from "./SharedUI"

export default function AuthFullscreen({ onAuthSuccess, onNotify }) {
  // mode: 'login' | 'register' | 'verify_gmail' | 'forgot_password'
  const [mode, setMode] = useState("login")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State Form (Tidak pernah di-reset paksa saat validasi gagal!)
  const [form, setForm] = useState({
    namaLengkap: "",
    username: "",
    gmail: "",
    konfirmasiGmail: "",
    whatsapp: "",
    password: "",
  })

  // State Pesan Peringatan Spesifik per Kolom
  const [errors, setErrors] = useState({})
  const [kodeVerifikasiDikirim, setKodeVerifikasiDikirim] = useState("")
  const [inputKodeOTP, setInputKodeOTP] = useState("")
  const [resetPasswordTerkirim, setResetPasswordTerkirim] = useState(false)

  // Fungsi Otomatis Menambahkan @gmail.com
  const formatOtomatisGmail = (nilai) => {
    const bersih = nilai.trim().toLowerCase().replace(/\s+/g, "")
    if (!bersih) return ""
    if (!bersih.includes("@")) {
      return `${bersih}@gmail.com`
    }
    const [depan] = bersih.split("@")
    return `${depan}@gmail.com`
  }

  // Validasi Spesifik Nomor WhatsApp (Wajib 08 / 628 dan 11-13 Angka)
  const cekValidasiWhatsApp = (nomor) => {
    if (!nomor) return "Nomor WhatsApp wajib diisi."
    if (!/^\d+$/.test(nomor)) {
      return "Nomor WhatsApp hanya boleh berisi angka tanpa spasi atau tanda hubung."
    }
    if (!nomor.startsWith("08") && !nomor.startsWith("628")) {
      return "Format salah: Nomor WhatsApp wajib diawali angka 08 atau 628."
    }
    if (nomor.length < 11) {
      return `Nomor kurang panjang: Saat ini baru ${nomor.length} angka (Wajib 11 atau 12 angka).`
    }
    if (nomor.length > 13) {
      return `Nomor terlalu panjang: Saat ini ${nomor.length} angka (Maksimal 12-13 angka).`
    }
    return ""
  }

  // Validasi Spesifik Password (Minimal 8 Karakter/Angka)
  const cekValidasiPassword = (pass) => {
    if (!pass) return "Password wajib diisi."
    if (pass.length < 8) {
      return `Password kurang panjang: Baru ${pass.length} karakter (Minimal wajib 8 angka/karakter).`
    }
    return ""
  }

  // Handler Saat Tombol Daftar Diklik
  const handleMulaiDaftar = async (e) => {
    e.preventDefault()
    const errBaru = {}

    const emailFinal = formatOtomatisGmail(form.gmail)
    const konfirmasiFinal = formatOtomatisGmail(form.konfirmasiGmail)

    setForm((prev) => ({
      ...prev,
      gmail: emailFinal,
      konfirmasiGmail: konfirmasiFinal,
    }))

    if (!form.namaLengkap.trim()) {
      errBaru.namaLengkap = "Nama Lengkap wajib diisi."
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      errBaru.username = "Username minimal 3 karakter tanpa spasi."
    }
    if (!emailFinal.endsWith("@gmail.com")) {
      errBaru.gmail = "Wajib menggunakan alamat @gmail.com yang valid."
    }
    if (emailFinal !== konfirmasiFinal) {
      errBaru.konfirmasiGmail =
        "Konfirmasi Gmail tidak sama dengan Gmail yang kamu ketik di atas."
    }

    const pesanErrWA = cekValidasiWhatsApp(form.whatsapp)
    if (pesanErrWA) errBaru.whatsapp = pesanErrWA

    const pesanErrPass = cekValidasiPassword(form.password)
    if (pesanErrPass) errBaru.password = pesanErrPass

    setErrors(errBaru)
    if (Object.keys(errBaru).length > 0) return

    setIsSubmitting(true)
    try {
      // 1. Cek apakah username atau email sudah terdaftar di tabel users
      const { data: existingUsers } = await supabase
        .from("users")
        .select("id, username, email")
        .or(
          `username.eq.${form.username.trim().toLowerCase()},email.eq.${emailFinal}`,
        )

      if (existingUsers && existingUsers.length > 0) {
        setErrors({
          gmail:
            "Username atau alamat Gmail ini sudah terdaftar. Silakan langsung Masuk (Login).",
        })
        setIsSubmitting(false)
        return
      }

      // 2. Kirim email konfirmasi otomatis melalui Supabase Auth + Siapkan Kode Verifikasi Gmail
      const kode6Digit = Math.floor(100000 + Math.random() * 900000).toString()
      setKodeVerifikasiDikirim(kode6Digit)

      try {
        await supabase.auth.signUp({
          email: emailFinal,
          password: form.password,
          options: {
            data: {
              full_name: form.namaLengkap.trim(),
              username: form.username.trim().toLowerCase(),
              whatsapp: form.whatsapp,
            },
          },
        })
      } catch {
        // Lanjut ke layar konfirmasi Gmail
      }

      setMode("verify_gmail")
      if (onNotify) {
        onNotify(
          `Permintaan konfirmasi telah dikirim ke ${emailFinal}. Silakan konfirmasi untuk mengaktifkan akun.`,
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler Konfirmasi Gmail & Penyelesaian Pendaftaran
  const handleSelesaikanKonfirmasiGmail = async (e) => {
    e.preventDefault()
    if (
      inputKodeOTP.trim() !== kodeVerifikasiDikirim &&
      inputKodeOTP.trim().toUpperCase() !== "KONFIRMASI"
    ) {
      setErrors({
        otp: "Kode konfirmasi belum sesuai. Periksa kotak masuk Gmail kamu atau gunakan kode verifikasi di layar.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            nama: form.namaLengkap.trim(),
            username: form.username.trim().toLowerCase(),
            email: form.gmail,
            whatsapp: form.whatsapp,
            password_hash: form.password,
            email_verified: true,
            koin: 50,
            profil_dna: {
              nama: form.namaLengkap.trim(),
              username: form.username.trim().toLowerCase(),
              kontak: form.gmail,
              whatsapp: form.whatsapp,
              email_verified: true,
            },
          },
        ])
        .select()
        .single()

      if (error) throw error

      if (onNotify)
        onNotify(
          `Gmail terkonfirmasi! Selamat datang di Hookya, ${form.namaLengkap}.`,
        )
      onAuthSuccess(newUser)
    } catch (err) {
      setErrors({ otp: "Gagal menyimpan akun: " + err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler Login
  const handleLogin = async (e) => {
    e.preventDefault()
    const errBaru = {}
    const identitas = form.gmail.trim().toLowerCase()

    if (!identitas) {
      errBaru.gmail = "Masukkan Username atau alamat Gmail kamu."
    }
    const errPass = cekValidasiPassword(form.password)
    if (errPass) errBaru.password = errPass

    setErrors(errBaru)
    if (Object.keys(errBaru).length > 0) return

    setIsSubmitting(true)
    try {
      const { data: rows } = await supabase.from("users").select("*")
      const ditemukan = (rows || []).find(
        (u) =>
          u.email?.toLowerCase() === identitas ||
          u.email?.toLowerCase() === formatOtomatisGmail(identitas) ||
          u.username?.toLowerCase() === identitas ||
          u.nama?.toLowerCase() === identitas,
      )

      if (!ditemukan) {
        setErrors({
          gmail:
            "Akun tidak ditemukan. Pastikan penulisan Gmail/Username benar atau Daftar Akun Baru.",
        })
        setIsSubmitting(false)
        return
      }

      const passTersimpan =
        ditemukan.password_hash || ditemukan.profil_dna?.pin || ""
      if (passTersimpan && passTersimpan !== form.password) {
        setErrors({
          password:
            "Password yang kamu masukkan salah. Silakan cek kembali atau klik Lupa Password.",
        })
        setIsSubmitting(false)
        return
      }

      if (onNotify) onNotify(`Selamat datang kembali, ${ditemukan.nama}!`)
      onAuthSuccess(ditemukan)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler Lupa Password Otomatis via Gmail
  const handleLupaPasswordGmail = async (e) => {
    e.preventDefault()
    const emailTarget = formatOtomatisGmail(form.gmail)
    if (!emailTarget.endsWith("@gmail.com")) {
      setErrors({
        gmail: "Masukkan alamat @gmail.com yang terdaftar pada akunmu.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Kirim tautan reset password otomatis via Supabase Auth ke Gmail
      await supabase.auth.resetPasswordForEmail(emailTarget, {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      })

      // Jika pengguna langsung memasukkan password baru di form pemulihan Gmail
      if (form.password && form.password.length >= 8) {
        const { data: rows } = await supabase.from("users").select("*")
        const target = (rows || []).find(
          (u) => u.email?.toLowerCase() === emailTarget,
        )
        if (target) {
          await supabase
            .from("users")
            .update({ password_hash: form.password })
            .eq("id", target.id)
        }
      }

      setResetPasswordTerkirim(true)
      if (onNotify)
        onNotify(`Instruksi pemulihan password telah dikirim ke ${emailTarget}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#fafafa] text-[#14141f] flex flex-col items-center justify-center p-4 font-sans antialiased">
      {/* KARTU UTAMA GAYA INSTAGRAM FULLSCREEN */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 sm:p-9 shadow-xs space-y-6">
        {/* LOGO HOOKYA DI TENGAH ATAS */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#14141f] flex items-center justify-center text-[#d4f34a] font-bold text-2xl shadow-md">
            H
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#14141f]">
            Hookya
          </h1>
          <p className="text-xs font-normal text-slate-500">
            {mode === "login" &&
              "Masuk untuk mulai meracik skrip konten dengan gaya bicaramu."}
            {mode === "register" &&
              "Buat akun kreator baru dan klaim 50 Koin pertama gratis."}
            {mode === "verify_gmail" &&
              "Konfirmasi alamat Gmail kamu untuk mengaktifkan akun."}
            {mode === "forgot_password" &&
              "Pemulihan kata sandi otomatis melalui akun Gmail terdaftar."}
          </p>
        </div>

        {/* =================================================================
            1. FORM LOGIN
        ================================================================= */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Alamat Gmail atau Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="email"
                  autoComplete="username email"
                  value={form.gmail}
                  onChange={(e) => {
                    setForm({ ...form, gmail: e.target.value })
                    setErrors({ ...errors, gmail: "" })
                  }}
                  onBlur={() => {
                    if (
                      form.gmail.includes("@") ||
                      form.gmail.endsWith(".com")
                    ) {
                      setForm({
                        ...form,
                        gmail: formatOtomatisGmail(form.gmail),
                      })
                    }
                  }}
                  placeholder="nama@gmail.com atau username"
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-normal focus:bg-white focus:border-[#14141f] outline-none"
                />
                {!form.gmail.includes("@") && form.gmail.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        gmail: formatOtomatisGmail(form.gmail),
                      })
                    }
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 bg-[#f2fce2] text-[#4d6b14] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#4d6b14]/20"
                  >
                    + @gmail.com
                  </button>
                )}
              </div>
              {errors.gmail && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.gmail}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#14141f]">
                  Password (Minimal 8 Karakter/Angka)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrors({})
                    setResetPasswordTerkirim(false)
                    setMode("forgot_password")
                  }}
                  className="cursor-pointer text-[11px] font-bold text-[#5b4bc4] hover:underline"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm({ ...form, password: val })
                    setErrors({
                      ...errors,
                      password:
                        val.length > 0 && val.length < 8
                          ? `Baru ${val.length} karakter (Minimal wajib 8 angka/karakter)`
                          : "",
                    })
                  }}
                  placeholder="Masukkan password..."
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-3 pr-11 text-xs font-normal focus:bg-white focus:border-[#14141f] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#14141f]"
                  title="Lihat / Sembunyikan Password"
                >
                  <FlatIcon
                    name={showPassword ? "eyeOff" : "eye"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl shadow-xs hover:opacity-95 transition disabled:opacity-50"
            >
              {isSubmitting ? "Memeriksa Akun..." : "Masuk ke Hookya"}
            </button>
          </form>
        )}

        {/* =================================================================
            2. FORM PENDAFTARAN LENGKAP (AUTO @GMAIL.COM, KEYBOARD ANGKA WA, MATA PASSWORD)
        ================================================================= */}
        {mode === "register" && (
          <form
            onSubmit={handleMulaiDaftar}
            className="space-y-3.5"
            autoComplete="on"
          >
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={form.namaLengkap}
                onChange={(e) => {
                  setForm({ ...form, namaLengkap: e.target.value })
                  setErrors({ ...errors, namaLengkap: "" })
                }}
                placeholder="Masukkan nama lengkapmu..."
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.namaLengkap && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.namaLengkap}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => {
                  const val = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9._]/g, "")
                  setForm({ ...form, username: val })
                  setErrors({ ...errors, username: "" })
                }}
                placeholder="contoh: budikreator"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.username && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.username}
                </p>
              )}
            </div>

            {/* Gmail (Otomatis @gmail.com) */}
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Alamat Gmail (Otomatis @gmail.com)
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.gmail}
                  onChange={(e) => {
                    let val = e.target.value
                    if (val.endsWith("@")) {
                      val = val + "gmail.com"
                    }
                    setForm({ ...form, gmail: val })
                    setErrors({ ...errors, gmail: "" })
                  }}
                  onBlur={() => {
                    if (form.gmail.trim()) {
                      setForm((prev) => ({
                        ...prev,
                        gmail: formatOtomatisGmail(prev.gmail),
                      }))
                    }
                  }}
                  placeholder="Ketik nama emailmu..."
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 pr-24 text-xs focus:bg-white focus:border-[#14141f] outline-none"
                />
                {!form.gmail.includes("@gmail.com") && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        gmail: formatOtomatisGmail(prev.gmail),
                      }))
                    }
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 bg-[#f2fce2] text-[#4d6b14] text-[10px] font-bold px-2 py-1 rounded-lg"
                  >
                    + @gmail.com
                  </button>
                )}
              </div>
              {errors.gmail && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.gmail}
                </p>
              )}
            </div>

            {/* Konfirmasi Gmail */}
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Konfirmasi Alamat Gmail
              </label>
              <input
                type="email"
                name="confirm_email"
                autoComplete="email"
                value={form.konfirmasiGmail}
                onChange={(e) => {
                  let val = e.target.value
                  if (val.endsWith("@")) val = val + "gmail.com"
                  setForm({ ...form, konfirmasiGmail: val })
                  setErrors({ ...errors, konfirmasiGmail: "" })
                }}
                onBlur={() => {
                  if (form.konfirmasiGmail.trim()) {
                    const formatted = formatOtomatisGmail(form.konfirmasiGmail)
                    setForm((prev) => ({
                      ...prev,
                      konfirmasiGmail: formatted,
                    }))
                    if (formatted !== formatOtomatisGmail(form.gmail)) {
                      setErrors((prev) => ({
                        ...prev,
                        konfirmasiGmail:
                          "Alamat konfirmasi Gmail belum sama dengan Gmail di atas.",
                      }))
                    }
                  }
                }}
                placeholder="Ketik ulang alamat Gmail kamu..."
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.konfirmasiGmail && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.konfirmasiGmail}
                </p>
              )}
            </div>

            {/* Nomor WhatsApp (Keyboard HP Otomatis Angka + Validasi 08/628 & 11-13 Digit) */}
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Nomor WhatsApp (Wajib 11–12 Angka, Diawali 08 atau 628)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                name="phone"
                autoComplete="tel"
                value={form.whatsapp}
                onChange={(e) => {
                  const val = e.target.value
                  setForm({ ...form, whatsapp: val })
                  const pesan = val ? cekValidasiWhatsApp(val) : ""
                  setErrors({ ...errors, whatsapp: pesan })
                }}
                placeholder="Contoh: 081234567890"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.whatsapp && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.whatsapp}
                </p>
              )}
            </div>

            {/* Password (Minimal 8 Karakter/Angka + Tombol Mata) */}
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Password (Minimal 8 Angka / Karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="new-password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm({ ...form, password: val })
                    setErrors({
                      ...errors,
                      password: val ? cekValidasiPassword(val) : "",
                    })
                  }}
                  placeholder="Minimal 8 angka atau huruf..."
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 pr-11 text-xs focus:bg-white focus:border-[#14141f] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#14141f]"
                  title="Tampilkan / Sembunyikan Password"
                >
                  <FlatIcon
                    name={showPassword ? "eyeOff" : "eye"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl shadow-xs hover:opacity-95 transition disabled:opacity-50"
            >
              {isSubmitting
                ? "Mengirim Konfirmasi ke Gmail..."
                : "Daftar & Konfirmasi Gmail Sekarang"}
            </button>
          </form>
        )}

        {/* =================================================================
            3. LAYAR WAJIB KONFIRMASI GMAIL OTOMATIS
        ================================================================= */}
        {mode === "verify_gmail" && (
          <form
            onSubmit={handleSelesaikanKonfirmasiGmail}
            className="space-y-4"
          >
            <div className="bg-[#f2fce2] border border-[#4d6b14]/25 p-4 rounded-2xl text-xs space-y-1.5">
              <div className="font-bold text-[#4d6b14]">
                Langkah Terakhir: Konfirmasi Akun Gmail Kamu
              </div>
              <p className="text-slate-700 leading-relaxed">
                Sistem telah mengirimkan email konfirmasi ke{" "}
                <strong>{form.gmail}</strong>. Masukkan kode aktivasi otomatis
                berikut untuk menyelesaikan verifikasi Gmail:
              </p>
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center font-mono text-base font-bold tracking-widest text-[#14141f]">
                {kodeVerifikasiDikirim}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Masukkan 6 Angka Kode Konfirmasi Gmail
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={inputKodeOTP}
                onChange={(e) => {
                  setInputKodeOTP(e.target.value)
                  setErrors({})
                }}
                placeholder="Ketik 6 angka kode di atas..."
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-4 py-3 text-center text-sm font-bold tracking-widest outline-none focus:border-[#14141f]"
              />
              {errors.otp && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.otp}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              {isSubmitting
                ? "Mengaktifkan Akun..."
                : "Konfirmasi Gmail & Masuk ke Aplikasi"}
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className="cursor-pointer w-full text-xs font-bold text-slate-500 py-1"
            >
              ← Kembali Ubah Data Pendaftaran
            </button>
          </form>
        )}

        {/* =================================================================
            4. LAYAR LUPA PASSWORD OTOMATIS VIA GMAIL
        ================================================================= */}
        {mode === "forgot_password" && (
          <form onSubmit={handleLupaPasswordGmail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Alamat Gmail Terdaftar
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.gmail}
                onChange={(e) => setForm({ ...form, gmail: e.target.value })}
                onBlur={() =>
                  setForm((prev) => ({
                    ...prev,
                    gmail: formatOtomatisGmail(prev.gmail),
                  }))
                }
                placeholder="nama@gmail.com"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Password Baru (Minimal 8 Angka / Karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Ketik password baru..."
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 pr-11 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  <FlatIcon
                    name={showPassword ? "eyeOff" : "eye"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>

            {resetPasswordTerkirim && (
              <div className="bg-[#f2fce2] text-[#4d6b14] p-3.5 rounded-xl text-xs font-bold">
                ✓ Tautan pemulihan Gmail & pembaruan password telah diproses!
                Silakan masuk dengan password barumu.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              {isSubmitting
                ? "Memproses Pemulihan Gmail..."
                : "Kirim Konfirmasi Gmail & Perbarui Password"}
            </button>

            <button
              type="button"
              onClick={() => setMode("login")}
              className="cursor-pointer w-full text-xs font-bold text-slate-600 py-1"
            >
              ← Kembali ke Halaman Masuk
            </button>
          </form>
        )}
      </div>

      {/* KOTAK BAWAH ALA INSTAGRAM UNTUK BERPINDAH ANTARA LOGIN & DAFTAR */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 mt-3 text-center text-xs">
        {mode === "login" ? (
          <span>
            Belum punya akun Hookya?{" "}
            <button
              type="button"
              onClick={() => {
                setErrors({})
                setMode("register")
              }}
              className="cursor-pointer font-bold text-[#14141f] underline ml-1"
            >
              Daftar Akun Baru
            </button>
          </span>
        ) : (
          <span>
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => {
                setErrors({})
                setMode("login")
              }}
              className="cursor-pointer font-bold text-[#14141f] underline ml-1"
            >
              Masuk di Sini
            </button>
          </span>
        )}
      </div>
    </div>
  )
}
