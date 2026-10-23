"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import { FlatIcon } from "./SharedUI"

const PILIHAN_PAKET_PENDAFTARAN = [
  {
    id: "coba",
    nama: "Paket Coba",
    hargaTeks: "Rp5.000",
    nominal: 5000,
    koin: 10,
    ket: "10 Koin (Aktif 30 Hari) untuk membuat skrip teks & 6 Hook Copywriting.",
  },
  {
    id: "pemula",
    nama: "Paket Pemula",
    hargaTeks: "Rp10.000",
    nominal: 10000,
    koin: 20,
    ket: "20 Koin (Aktif 30 Hari) untuk kebutuhan skrip konten rutin.",
  },
  {
    id: "kreator",
    nama: "Paket Kreator VIP (Terlaris)",
    hargaTeks: "Rp25.000",
    nominal: 25000,
    koin: 50,
    populer: true,
    ket: "👑 50 Koin + Buka Fitur Rekam Suara Mic, Scan Produk Marketplace & Ekstrak Video!",
  },
  {
    id: "vip",
    nama: "Paket Produser VIP",
    hargaTeks: "Rp99.000",
    nominal: 99000,
    koin: 200,
    ket: "👑 200 Koin + Akses Penuh Seluruh Fitur VIP untuk produksi konten masif.",
  },
]

export default function AuthFullscreen({ onAuthSuccess, onNotify }) {
  // mode: 'login' | 'register_step1' | 'register_step2_package' | 'register_step3_pay' | 'forgot_password'
  const [mode, setMode] = useState("login")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    namaLengkap: "",
    username: "",
    gmail: "",
    whatsapp: "",
    password: "",
  })

  const [tipeAktivasi, setTipeAktivasi] = useState("berbayar") // 'berbayar' | 'voucher' | 'tester'
  const [paketTerpilih, setPaketTerpilih] = useState(
    PILIHAN_PAKET_PENDAFTARAN[2],
  )
  const [kodeVoucherInput, setKodeVoucherInput] = useState("")
  const [invoiceReg, setInvoiceReg] = useState(null)
  const [sudahKlikBayar, setSudahKlikBayar] = useState(false)

  const [errors, setErrors] = useState({})
  const [infoPesanHijau, setInfoPesanHijau] = useState("")

  // Otomatis menambahkan @gmail.com
  const formatOtomatisGmail = (nilai) => {
    const bersih = nilai.trim().toLowerCase().replace(/\s+/g, "")
    if (!bersih) return ""
    if (!bersih.includes("@")) {
      return `${bersih}@gmail.com`
    }
    const [depan] = bersih.split("@")
    return `${depan}@gmail.com`
  }

  // Membuat URL Foto Profil Default berdasarkan akun Gmail/Nama pengguna
  const buatAvatarDefaultGmail = (nama, email) => {
    const namaBersih = encodeURIComponent(nama || email || "User")
    return `https://ui-avatars.com/api/?name=${namaBersih}&background=d4f34a&color=14141f&bold=true&size=128`
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

  // LANGKAH 1 PENDAFTARAN: VALIDASI DATA DIRI (TANPA KONFIRMASI GMAIL GANDA)
  const handleLanjutKePilihPaket = async (e) => {
    e.preventDefault()
    const errBaru = {}
    setInfoPesanHijau("")

    const emailFinal = formatOtomatisGmail(form.gmail)
    setForm((prev) => ({ ...prev, gmail: emailFinal }))

    if (!form.namaLengkap.trim()) {
      errBaru.namaLengkap = "Nama Lengkap wajib diisi."
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      errBaru.username = "Username minimal 3 karakter tanpa spasi."
    }
    if (!emailFinal.endsWith("@gmail.com")) {
      errBaru.gmail = "Wajib menggunakan alamat @gmail.com yang valid."
    }

    const pesanErrWA = cekValidasiWhatsApp(form.whatsapp)
    if (pesanErrWA) errBaru.whatsapp = pesanErrWA

    const pesanErrPass = cekValidasiPassword(form.password)
    if (pesanErrPass) errBaru.password = pesanErrPass

    setErrors(errBaru)
    if (Object.keys(errBaru).length > 0) return

    setIsSubmitting(true)
    try {
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

      setMode("register_step2_package")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simpan user baru ke Supabase & langsung masuk
  const selesaikanSimpanUserBaru = async (
    jumlahKoinAwal,
    namaPaketAwal,
    dataInvoice,
  ) => {
    const avatarDefault = buatAvatarDefaultGmail(
      form.namaLengkap.trim(),
      form.gmail,
    )

    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          nama: form.namaLengkap.trim(),
          username: form.username.trim().toLowerCase(),
          email: form.gmail,
          whatsapp: form.whatsapp,
          password_hash: form.password,
          avatar_url: avatarDefault,
          email_verified: true,
          koin: jumlahKoinAwal,
          profil_dna: {
            nama: form.namaLengkap.trim(),
            username: form.username.trim().toLowerCase(),
            kontak: form.gmail,
            whatsapp: form.whatsapp,
            avatar_url: avatarDefault,
            paketAktif: namaPaketAwal,
            email_verified: true,
          },
        },
      ])
      .select()
      .single()

    if (error) throw error

    if (dataInvoice && newUser?.id) {
      try {
        await supabase.from("transactions").insert([
          {
            invoice_id: dataInvoice.invoiceId,
            user_id: newUser.id,
            nama_user: form.namaLengkap.trim(),
            nama_paket: dataInvoice.namaPaket,
            jumlah_koin: dataInvoice.koin,
            nominal_asli: dataInvoice.nominalAsli,
            nominal_bayar: dataInvoice.nominalUnik,
            metode_bayar: dataInvoice.duitkuUrl
              ? "Duitku Pendaftaran"
              : "QRIS Pendaftaran",
            status: "lunas",
          },
        ])
      } catch {
        // Abaikan
      }
    }

    if (onNotify) {
      onNotify(
        `Akun berhasil dibuat dengan ${jumlahKoinAwal} Koin! Selamat datang, ${form.namaLengkap}.`,
      )
    }
    onAuthSuccess(newUser)
  }

  // LANGKAH 2 PENDAFTARAN: PROSES PILIH PAKET / VOUCHER / TESTER
  const handleProsesPaketPendaftaran = async () => {
    setErrors({})
    setIsSubmitting(true)

    try {
      if (tipeAktivasi === "voucher") {
        const kodeBersih = kodeVoucherInput.trim().toUpperCase()
        if (!kodeBersih) {
          setErrors({ paket: "Masukkan kode voucher terlebih dahulu." })
          setIsSubmitting(false)
          return
        }
        const { data: adminRows } = await supabase
          .from("users")
          .select("profil_dna")
          .order("created_at", { ascending: true })
          .limit(1)

        const listVoucher = adminRows?.[0]?.profil_dna?.daftarVoucher || [
          { kode: "HOOKYA100", koin: 100, kuota: 50, terpakai: 0 },
          { kode: "GRATIS50", koin: 50, kuota: 100, terpakai: 0 },
        ]

        const vDitemukan = listVoucher.find(
          (v) => v.kode.toUpperCase() === kodeBersih,
        )
        if (!vDitemukan || vDitemukan.terpakai >= vDitemukan.kuota) {
          setErrors({
            paket: "Kode voucher tidak ditemukan atau kuotanya sudah habis.",
          })
          setIsSubmitting(false)
          return
        }
        await selesaikanSimpanUserBaru(
          parseInt(vDitemukan.koin) || 50,
          `Voucher ${kodeBersih}`,
          null,
        )
        return
      }

      if (tipeAktivasi === "tester") {
        await selesaikanSimpanUserBaru(2, "Akun Tester (2 Koin)", null)
        return
      }

      // Jika memilih Paket Berbayar -> Buat Tagihan Duitku / QRIS
      const kodeUnik = Math.floor(101 + Math.random() * 890)
      const nomorInv = `REG-${Date.now().toString().slice(-6)}`
      let duitkuUrl = ""

      try {
        const resPay = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_gateway_invoice",
            invoiceId: nomorInv,
            namaUser: form.namaLengkap.trim(),
            emailUser: form.gmail,
            namaPaket: paketTerpilih.nama,
            jumlahKoin: paketTerpilih.koin,
            nominal: paketTerpilih.nominal,
          }),
        })
        const dataPay = await resPay.json()
        if (dataPay.mode === "duitku" && dataPay.redirectUrl) {
          duitkuUrl = dataPay.redirectUrl
          window.open(dataPay.redirectUrl, "_blank")
        }
      } catch {
        // Fallback QRIS
      }

      setInvoiceReg({
        invoiceId: nomorInv,
        namaPaket: paketTerpilih.nama,
        koin: paketTerpilih.koin,
        nominalAsli: paketTerpilih.nominal,
        nominalUnik: paketTerpilih.nominal + kodeUnik,
        duitkuUrl,
      })
      setMode("register_step3_pay")
    } catch (err) {
      setErrors({ paket: "Gagal memproses pendaftaran: " + err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // LANGKAH 3 PENDAFTARAN (KHUSUS PAKET BERBAYAR)
  const handleSelesaikanPembayaranPendaftaran = async (e) => {
    e.preventDefault()
    if (!sudahKlikBayar) {
      setErrors({
        bayar:
          "Silakan centang 'Saya sudah melakukan pembayaran paket ini' terlebih dahulu.",
      })
      return
    }
    setIsSubmitting(true)
    try {
      await selesaikanSimpanUserBaru(
        paketTerpilih.koin,
        paketTerpilih.nama,
        invoiceReg,
      )
    } catch (err) {
      setErrors({ bayar: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // LOGIN PENGGUNA
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

  // LUPA PASSWORD PASTI (VERIFIKASI GMAIL + NOMOR WHATSAPP TERDAFTAR)
  const handleResetPasswordPasti = async (e) => {
    e.preventDefault()
    const errBaru = {}
    const emailTarget = formatOtomatisGmail(form.gmail)
    setForm((prev) => ({ ...prev, gmail: emailTarget }))

    if (!emailTarget.endsWith("@gmail.com")) {
      errBaru.gmail = "Masukkan alamat @gmail.com yang terdaftar."
    }
    const errWA = cekValidasiWhatsApp(form.whatsapp)
    if (errWA) errBaru.whatsapp = errWA

    const errPass = cekValidasiPassword(form.password)
    if (errPass) errBaru.password = errPass

    setErrors(errBaru)
    if (Object.keys(errBaru).length > 0) return

    setIsSubmitting(true)
    try {
      const { data: rows } = await supabase.from("users").select("*")
      const akunCocok = (rows || []).find(
        (u) =>
          u.email?.toLowerCase() === emailTarget &&
          (u.whatsapp === form.whatsapp ||
            u.profil_dna?.whatsapp === form.whatsapp),
      )

      if (!akunCocok) {
        setErrors({
          gmail:
            "Kombinasi alamat Gmail dan Nomor WhatsApp tidak cocok dengan akun mana pun.",
        })
        setIsSubmitting(false)
        return
      }

      // Kirim juga notifikasi reset ke Gmail melalui Supabase Auth
      try {
        await supabase.auth.resetPasswordForEmail(emailTarget)
      } catch {
        // Lanjut update database
      }

      await supabase
        .from("users")
        .update({ password_hash: form.password })
        .eq("id", akunCocok.id)

      setInfoPesanHijau(
        "Password baru berhasil disimpan! Silakan masuk menggunakan password barumu.",
      )
      setMode("login")
    } catch (err) {
      setErrors({ gmail: "Gagal memperbarui password: " + err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#fafafa] text-[#14141f] flex flex-col items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-9 shadow-xs space-y-6">
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
            {mode === "register_step1" &&
              "Langkah 1 dari 2: Lengkapi data diri akun kreator barumu."}
            {mode === "register_step2_package" &&
              "Langkah 2 dari 2: Pilih paket aktivasi akunmu."}
            {mode === "register_step3_pay" &&
              "Selesaikan pembayaran paket untuk mengaktifkan akun."}
            {mode === "forgot_password" &&
              "Verifikasi Gmail & WhatsApp terdaftar untuk membuat password baru."}
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
            2. FORM PENDAFTARAN LANGKAH 1 (TANPA KONFIRMASI GMAIL GANDA)
        ================================================================= */}
        {mode === "register_step1" && (
          <form
            onSubmit={handleLanjutKePilihPaket}
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
                ? "Memeriksa Data..."
                : "Lanjut Pilih Paket Aktivasi ➔"}
            </button>
          </form>
        )}

        {/* =================================================================
            3. LANGKAH 2: PILIH PAKET KOIN / VOUCHER / TESTER
        ================================================================= */}
        {mode === "register_step2_package" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5 bg-[#f4f5f7] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setTipeAktivasi("berbayar")}
                className={`cursor-pointer py-2 px-2 rounded-xl text-[11px] font-bold transition ${
                  tipeAktivasi === "berbayar"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Pilih Paket Koin
              </button>
              <button
                type="button"
                onClick={() => setTipeAktivasi("voucher")}
                className={`cursor-pointer py-2 px-2 rounded-xl text-[11px] font-bold transition ${
                  tipeAktivasi === "voucher"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Pakai Voucher
              </button>
              <button
                type="button"
                onClick={() => setTipeAktivasi("tester")}
                className={`cursor-pointer py-2 px-2 rounded-xl text-[11px] font-bold transition ${
                  tipeAktivasi === "tester"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Tester (2 Koin)
              </button>
            </div>

            {tipeAktivasi === "berbayar" && (
              <div className="space-y-2.5">
                {PILIHAN_PAKET_PENDAFTARAN.map((p) => {
                  const sedangDipilih = paketTerpilih.id === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaketTerpilih(p)}
                      className={`cursor-pointer w-full p-4 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                        sedangDipilih
                          ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                          : "bg-[#fafafa] text-[#14141f] border-slate-200"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold">
                            {p.nama}
                          </span>
                          <span className="text-[10px] font-bold bg-[#14141f] text-[#d4f34a] px-2 py-0.5 rounded-full">
                            +{p.koin} Koin
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {p.ket}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-bold">
                          {p.hargaTeks}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {tipeAktivasi === "voucher" && (
              <div className="bg-[#f4f5f7] p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-[#14141f]">
                  Masukkan Kode Voucher Undangan / Promo:
                </label>
                <input
                  type="text"
                  value={kodeVoucherInput}
                  onChange={(e) =>
                    setKodeVoucherInput(e.target.value.toUpperCase())
                  }
                  placeholder="Contoh: HOOKYA100"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-center text-sm font-bold uppercase tracking-widest outline-none"
                />
              </div>
            )}

            {tipeAktivasi === "tester" && (
              <div className="bg-[#f4f5f7] p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-[#14141f]">
                  Mode Tester (Langsung Aktif • 2 Koin)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Akunmu langsung aktif dengan 2 Koin untuk mencoba membuat
                  skrip pertama.
                </p>
              </div>
            )}

            {errors.paket && (
              <p className="text-[11px] font-bold text-rose-600">
                ⚠️ {errors.paket}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("register_step1")}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] text-[#14141f] font-bold text-xs py-3.5 rounded-xl"
              >
                ← Kembali
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProsesPaketPendaftaran}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
              >
                {isSubmitting
                  ? "Mengaktifkan Akun..."
                  : tipeAktivasi === "berbayar"
                    ? `Beli ${paketTerpilih.nama} (${paketTerpilih.hargaTeks}) ➔`
                    : "Aktifkan Akun & Masuk Sekarang ➔"}
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            4. PEMBAYARAN PAKET PENDAFTARAN (DUITKU / QRIS)
        ================================================================= */}
        {mode === "register_step3_pay" && invoiceReg && (
          <form
            onSubmit={handleSelesaikanPembayaranPendaftaran}
            className="space-y-4"
          >
            <div className="bg-[#f4f5f7] p-5 rounded-2xl border border-slate-200 text-center space-y-3">
              <span className="text-[11px] font-bold bg-[#14141f] text-[#d4f34a] px-2.5 py-0.5 rounded-md">
                Tagihan #{invoiceReg.invoiceId}
              </span>
              <div className="text-xs font-bold text-[#14141f]">
                {invoiceReg.namaPaket} (+{invoiceReg.koin} Koin)
              </div>

              <div className="w-32 h-32 mx-auto bg-white rounded-2xl border border-slate-300 flex flex-col items-center justify-center p-2">
                <FlatIcon name="qr" className="w-20 h-20 text-[#14141f]" />
                <span className="text-[9px] font-bold text-slate-500">
                  DUITKU / QRIS
                </span>
              </div>

              <div className="text-xl font-bold text-[#14141f]">
                Rp{invoiceReg.nominalUnik.toLocaleString("id-ID")}
              </div>

              {invoiceReg.duitkuUrl && (
                <a
                  href={invoiceReg.duitkuUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-[#d4f34a] text-[#14141f] text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  Buka Halaman Pembayaran Duitku ↗
                </a>
              )}

              <label className="cursor-pointer flex items-center justify-center gap-2 pt-2 text-xs font-bold text-[#14141f]">
                <input
                  type="checkbox"
                  checked={sudahKlikBayar}
                  onChange={(e) => setSudahKlikBayar(e.target.checked)}
                  className="w-4 h-4 accent-[#14141f]"
                />
                <span>Saya sudah melakukan pembayaran paket ini</span>
              </label>
            </div>

            {errors.bayar && (
              <p className="text-[11px] font-bold text-rose-600">
                ⚠️ {errors.bayar}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              {isSubmitting
                ? "Mengaktifkan Akun..."
                : "Selesaikan & Masuk ke Hookya ➔"}
            </button>
          </form>
        )}

        {/* =================================================================
            5. LUPA PASSWORD PASTI (VERIFIKASI GMAIL + WHATSAPP TERDAFTAR)
        ================================================================= */}
        {mode === "forgot_password" && (
          <form onSubmit={handleResetPasswordPasti} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Alamat Gmail Terdaftar
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
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white"
              />
              {errors.gmail && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.gmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Nomor WhatsApp Terdaftar (Untuk Verifikasi Keamanan)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={form.whatsapp}
                onChange={(e) => {
                  setForm({ ...form, whatsapp: e.target.value })
                  setErrors({})
                }}
                placeholder="Contoh: 081234567890"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white"
              />
              {errors.whatsapp && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  ⚠️ {errors.whatsapp}
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
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 pr-11 text-xs outline-none focus:bg-white"
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
                : "Simpan Password Baru Sekarang"}
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

      {/* KOTAK BAWAH ALA INSTAGRAM */}
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-4 mt-3 text-center text-xs">
        {mode === "login" ? (
          <span>
            Belum punya akun Hookya?{" "}
            <button
              type="button"
              onClick={() => {
                setErrors({})
                setInfoPesanHijau("")
                setMode("register_step1")
              }}
              className="cursor-pointer font-bold text-[#14141f] underline ml-1"
            >
              Daftar & Pilih Paket Sekarang
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
