"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import { FlatIcon } from "./SharedUI"

export default function AuthFullscreen({ onAuthSuccess, onNotify }) {
  // mode: 'login' | 'register' | 'verify_gmail' | 'forgot_request' | 'forgot_verify'
  const [mode, setMode] = useState("login")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    namaLengkap: "",
    username: "",
    gmail: "",
    konfirmasiGmail: "",
    whatsapp: "",
    password: "",
  })

  const [errors, setErrors] = useState({})
  const [inputKodeOTP, setInputKodeOTP] = useState("")
  const [infoPesanHijau, setInfoPesanHijau] = useState("")

  // Otomatis melengkapi @gmail.com
  const formatOtomatisGmail = (nilai) => {
    const bersih = nilai.trim().toLowerCase().replace(/\s+/g, "")
    if (!bersih) return ""
    if (!bersih.includes("@")) {
      return `${bersih}@gmail.com`
    }
    const [depan] = bersih.split("@")
    return `${depan}@gmail.com`
  }

  // Validasi Spesifik Nomor WhatsApp (Wajib 11-13 Angka, Diawali 08 atau 628)
  const cekValidasiWhatsApp = (nomor) => {
    if (!nomor) return "Nomor WhatsApp wajib diisi."
    if (!/^\d+$/.test(nomor)) {
      return "Nomor WhatsApp hanya boleh berisi angka tanpa spasi atau tanda baca."
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

  // Validasi Spesifik Password (Minimal 8 Angka/Karakter)
  const cekValidasiPassword = (pass) => {
    if (!pass) return "Password wajib diisi."
    if (pass.length < 8) {
      return `Password kurang panjang: Baru ${pass.length} karakter (Minimal wajib 8 angka/karakter).`
    }
    return ""
  }

  // 1. MULAI PENDAFTARAN & KIRIM KONFIRMASI OTOMATIS KE GMAIL
  const handleMulaiDaftar = async (e) => {
    e.preventDefault()
    const errBaru = {}
    setInfoPesanHijau("")

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
        "Konfirmasi Gmail tidak sama dengan alamat Gmail di atas."
    }

    const pesanErrWA = cekValidasiWhatsApp(form.whatsapp)
    if (pesanErrWA) errBaru.whatsapp = pesanErrWA

    const pesanErrPass = cekValidasiPassword(form.password)
    if (pesanErrPass) errBaru.password = pesanErrPass

    setErrors(errBaru)
    if (Object.keys(errBaru).length > 0) return

    setIsSubmitting(true)
    try {
      // Cek duplikasi username atau email di tabel users
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

      // Kirim email konfirmasi otomatis lewat Supabase Auth
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp(
        {
          email: emailFinal,
          password: form.password,
          options: {
            data: {
              full_name: form.namaLengkap.trim(),
              username: form.username.trim().toLowerCase(),
              whatsapp: form.whatsapp,
            },
          },
        },
      )

      if (signUpErr) {
        throw new Error(signUpErr.message)
      }

      // Jika di pengaturan Supabase fitur "Confirm Email" dimatikan (langsung mendapat session),
      // otomatis daftarkan ke tabel users dan langsung masuk
      if (signUpData?.session) {
        await simpanAkunBaruKeTabelUsers(emailFinal)
        return
      }

      setMode("verify_gmail")
      setInfoPesanHijau(
        `Kode/Tautan konfirmasi telah dikirim otomatis ke ${emailFinal}. Silakan cek kotak masuk atau folder Spam Gmail kamu.`,
      )
      if (onNotify) {
        onNotify(`Email konfirmasi dikirim ke ${emailFinal}`)
      }
    } catch (err) {
      setErrors({
        gmail:
          "Gagal mengirim email konfirmasi (" +
          err.message +
          "). Pastikan penulisan Gmail benar.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const simpanAkunBaruKeTabelUsers = async (emailTerverifikasi) => {
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          nama: form.namaLengkap.trim(),
          username: form.username.trim().toLowerCase(),
          email: emailTerverifikasi,
          whatsapp: form.whatsapp,
          password_hash: form.password,
          email_verified: true,
          koin: 50,
          profil_dna: {
            nama: form.namaLengkap.trim(),
            username: form.username.trim().toLowerCase(),
            kontak: emailTerverifikasi,
            whatsapp: form.whatsapp,
            email_verified: true,
          },
        },
      ])
      .select()
      .single()

    if (error) throw error
    if (onNotify) {
      onNotify(
        `Gmail terkonfirmasi! Selamat datang di Hookya, ${form.namaLengkap}.`,
      )
    }
    onAuthSuccess(newUser)
  }

  // 2. VERIFIKASI KODE OTP GMAIL ATAU CEK STATUS KLIK LINK KONFIRMASI GMAIL
  const handleSelesaikanKonfirmasiGmail = async (e) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    try {
      // Jika pengguna memasukkan kode OTP 6 digit dari email
      if (inputKodeOTP.trim().length >= 6) {
        const { error: otpErr } = await supabase.auth.verifyOtp({
          email: form.gmail,
          token: inputKodeOTP.trim(),
          type: "signup",
        })
        if (otpErr) {
          throw new Error(
            "Kode OTP tidak sesuai atau sudah kedaluwarsa. Silakan cek kembali Gmail kamu.",
          )
        }
        await simpanAkunBaruKeTabelUsers(form.gmail)
        return
      }

      // Jika pengguna mengklik tautan "Confirm your mail" di dalam Gmail mereka,
      // kita uji dengan mencoba signIn menggunakan email & password yang baru didaftarkan
      const { data: signInData, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email: form.gmail,
          password: form.password,
        })

      if (signInErr || !signInData?.session) {
        throw new Error(
          "Akun Gmail kamu belum dikonfirmasi. Silakan buka aplikasi Gmail dan klik tautan konfirmasi, atau masukkan 6 angka kode OTP.",
        )
      }

      await simpanAkunBaruKeTabelUsers(form.gmail)
    } catch (err) {
      setErrors({ otp: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. LOGIN PENGGUNA
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
            "Password yang kamu masukkan belum sesuai. Silakan cek kembali atau klik Lupa Password.",
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

  // 4. LUPA PASSWORD TAHAP A: KIRIM OTP / LINK PEMULIHAN KE GMAIL
  const handleKirimPermintaanLupaPassword = async (e) => {
    e.preventDefault()
    setErrors({})
    const emailTarget = formatOtomatisGmail(form.gmail)
    setForm((prev) => ({ ...prev, gmail: emailTarget }))

    if (!emailTarget.endsWith("@gmail.com")) {
      setErrors({
        gmail: "Masukkan alamat @gmail.com yang terdaftar pada akunmu.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: rows } = await supabase.from("users").select("id, email")
      const akunAda = (rows || []).find(
        (u) => u.email?.toLowerCase() === emailTarget,
      )

      if (!akunAda) {
        setErrors({
          gmail: "Alamat Gmail ini belum terdaftar di sistem Hookya.",
        })
        setIsSubmitting(false)
        return
      }

      // Kirim OTP / email pemulihan resmi lewat Supabase Auth ke Gmail
      const { error: resetErr } = await supabase.auth.signInWithOtp({
        email: emailTarget,
      })

      if (resetErr) {
        await supabase.auth.resetPasswordForEmail(emailTarget)
      }

      setMode("forgot_verify")
      setInfoPesanHijau(
        `Kode pemulihan keamanan telah dikirim ke ${emailTarget}. Silakan cek kotak masuk Gmail kamu.`,
      )
    } catch (err) {
      setErrors({ gmail: "Gagal mengirim email pemulihan: " + err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. LUPA PASSWORD TAHAP B: VERIFIKASI KODE GMAIL & SIMPAN PASSWORD BARU
  const handleVerifikasiDanSimpanPasswordBaru = async (e) => {
    e.preventDefault()
    const errBaru = {}

    if (!inputKodeOTP.trim() || inputKodeOTP.trim().length < 6) {
      errBaru.otp =
        "Masukkan 6 angka kode pemulihan yang dikirim ke Gmail kamu."
    }
    const errPass = cekValidasiPassword(form.password)
    if (errPass) errBaru.password = errPass

    setErrors(errBaru)
    if (Object.keys(errBaru).length > 0) return

    setIsSubmitting(true)
    try {
      const emailTarget = formatOtomatisGmail(form.gmail)

      // Verifikasi OTP ke Supabase Auth
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: emailTarget,
        token: inputKodeOTP.trim(),
        type: "email",
      })

      if (verifyErr) {
        const { error: recErr } = await supabase.auth.verifyOtp({
          email: emailTarget,
          token: inputKodeOTP.trim(),
          type: "recovery",
        })
        if (recErr) {
          throw new Error("Kode pemulihan Gmail salah atau sudah kedaluwarsa.")
        }
      }

      // Perbarui password di Supabase Auth & tabel users
      await supabase.auth.updateUser({ password: form.password })
      await supabase
        .from("users")
        .update({ password_hash: form.password })
        .eq("email", emailTarget)

      if (onNotify) {
        onNotify(
          "Password baru berhasil disimpan! Silakan masuk menggunakan password barumu.",
        )
      }
      setInputKodeOTP("")
      setMode("login")
    } catch (err) {
      setErrors({ otp: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#fafafa] text-[#14141f] flex flex-col items-center justify-center p-4 font-sans antialiased">
      {/* KARTU UTAMA FULLSCREEN ALA INSTAGRAM */}
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
              "Wajib konfirmasi Gmail untuk mengaktifkan akun barumu."}
            {(mode === "forgot_request" || mode === "forgot_verify") &&
              "Layanan pemulihan password otomatis melalui Gmail."}
          </p>
        </div>

        {infoPesanHijau && (
          <div className="bg-[#f2fce2] border border-[#4d6b14]/25 text-[#4d6b14] p-3.5 rounded-2xl text-xs font-bold leading-relaxed">
            ✓ {infoPesanHijau}
          </div>
        )}

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
                  Password (Minimal 8 Angka / Karakter)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrors({})
                    setInfoPesanHijau("")
                    setMode("forgot_request")
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
            2. FORM PENDAFTARAN LENGKAP
        ================================================================= */}
        {mode === "register" && (
          <form
            onSubmit={handleMulaiDaftar}
            className="space-y-3.5"
            autoComplete="on"
          >
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
                    if (val.endsWith("@")) val = val + "gmail.com"
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
                  placeholder="Ketik nama akun Gmail kamu..."
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
                : "Daftar & Kirim Konfirmasi Gmail"}
            </button>
          </form>
        )}

        {/* =================================================================
            3. LAYAR VERIFIKASI GMAIL PENDAFTARAN (TANPA BOCORAN OTP DI LAYAR)
        ================================================================= */}
        {mode === "verify_gmail" && (
          <form
            onSubmit={handleSelesaikanKonfirmasiGmail}
            className="space-y-4"
          >
            <div className="bg-[#f4f5f7] p-4 rounded-2xl text-xs space-y-1.5 border border-slate-200">
              <div className="font-bold text-[#14141f]">
                Cek Kotak Masuk Gmail: {form.gmail}
              </div>
              <p className="text-slate-600 leading-relaxed">
                1. Klik tautan aktivasi di dalam email yang baru kami kirim,
                lalu tekan tombol{" "}
                <strong>"Saya Sudah Konfirmasi di Gmail"</strong> di bawah, ATAU
                <br />
                2. Masukkan 6 angka kode OTP jika tercantum di emailmu.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Kode OTP Gmail (Opsional jika sudah klik link di email)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={inputKodeOTP}
                onChange={(e) => {
                  setInputKodeOTP(e.target.value)
                  setErrors({})
                }}
                placeholder="Masukkan 6 angka OTP..."
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
                ? "Memeriksa Status Konfirmasi Gmail..."
                : "Saya Sudah Konfirmasi di Gmail ➔"}
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className="cursor-pointer w-full text-xs font-bold text-slate-500 py-1"
            >
              ← Kembali Ubah Alamat Gmail
            </button>
          </form>
        )}

        {/* =================================================================
            4. LAYAR LUPA PASSWORD TAHAP 1 (MINTA KODE PEMULIHAN KE GMAIL)
        ================================================================= */}
        {mode === "forgot_request" && (
          <form
            onSubmit={handleKirimPermintaanLupaPassword}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Masukkan Alamat Gmail Terdaftar
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.gmail}
                onChange={(e) => {
                  setForm({ ...form, gmail: e.target.value })
                  setErrors({})
                }}
                onBlur={() =>
                  setForm((prev) => ({
                    ...prev,
                    gmail: formatOtomatisGmail(prev.gmail),
                  }))
                }
                placeholder="nama@gmail.com"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-3 text-xs outline-none focus:bg-white focus:border-[#14141f]"
              />
              {errors.gmail && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.gmail}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              {isSubmitting
                ? "Mengirim Kode Pemulihan ke Gmail..."
                : "Kirim Kode Pemulihan ke Gmail Saya"}
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

        {/* =================================================================
            5. LAYAR LUPA PASSWORD TAHAP 2 (VERIFIKASI OTP GMAIL + PASSWORD BARU)
        ================================================================= */}
        {mode === "forgot_verify" && (
          <form
            onSubmit={handleVerifikasiDanSimpanPasswordBaru}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Kode Pemulihan 6 Angka dari Gmail ({form.gmail})
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={inputKodeOTP}
                onChange={(e) => {
                  setInputKodeOTP(e.target.value)
                  setErrors({ ...errors, otp: "" })
                }}
                placeholder="Ketik 6 angka kode dari Gmail..."
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-4 py-3 text-center text-sm font-bold tracking-widest outline-none focus:border-[#14141f]"
              />
              {errors.otp && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.otp}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Buat Password Baru (Minimal 8 Angka / Karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
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
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 pr-11 text-xs outline-none focus:bg-white focus:border-[#14141f]"
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
              {errors.password && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              {isSubmitting
                ? "Memverifikasi & Menyimpan Password..."
                : "Verifikasi Kode & Simpan Password Baru"}
            </button>
          </form>
        )}
      </div>

      {/* KOTAK BAWAH ALA INSTAGRAM */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 mt-3 text-center text-xs">
        {mode === "login" ? (
          <span>
            Belum punya akun Hookya?{" "}
            <button
              type="button"
              onClick={() => {
                setErrors({})
                setInfoPesanHijau("")
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
                setInfoPesanHijau("")
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
