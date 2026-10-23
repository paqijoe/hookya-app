"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { FlatIcon } from "./SharedUI"

const PILIHAN_PAKET_PENDAFTARAN = [
  {
    id: "5k",
    nama: "Paket 5K (Coba)",
    hargaTeks: "Rp5.000",
    nominal: 5000,
    koin: 10,
    durasiHari: 30,
    isVIP: false,
    ket: "10 Koin (Aktif 30 Hari) untuk membuat skrip teks dan 6 pilihan Hook.",
  },
  {
    id: "10k",
    nama: "Paket 10K (Pemula)",
    hargaTeks: "Rp10.000",
    nominal: 10000,
    koin: 20,
    durasiHari: 30,
    isVIP: false,
    ket: "20 Koin (Aktif 30 Hari) untuk latihan rutin membuat skrip mingguan.",
  },
  {
    id: "15k",
    nama: "Paket 15K (Hemat)",
    hargaTeks: "Rp15.000",
    nominal: 15000,
    koin: 30,
    durasiHari: 30,
    isVIP: false,
    ket: "30 Koin (Aktif 30 Hari) untuk pembuatan skrip konten reguler.",
  },
  {
    id: "20k",
    nama: "Paket 20K VIP",
    hargaTeks: "Rp20.000",
    nominal: 20000,
    koin: 40,
    durasiHari: 30,
    isVIP: true,
    ket: "40 Koin + Akses Fitur VIP: Rekam Suara Mic, Scan Produk Marketplace & Ekstrak Video.",
  },
  {
    id: "25k",
    nama: "Paket 25K VIP",
    hargaTeks: "Rp25.000",
    nominal: 25000,
    koin: 55,
    durasiHari: 30,
    isVIP: true,
    populer: true,
    ket: "55 Koin + Akses Semua Fitur VIP (Mic, Scan Produk, Ekstrak Video & Tanpa Watermark).",
  },
  {
    id: "50k",
    nama: "Paket 50K VIP (Pro)",
    hargaTeks: "Rp50.000",
    nominal: 50000,
    koin: 120,
    durasiHari: 30,
    isVIP: true,
    ket: "120 Koin + Akses Penuh Semua Fitur VIP & Pengganda Skrip 2x/5x/10x.",
  },
  {
    id: "90k",
    nama: "Paket 90K VIP (Agensi)",
    hargaTeks: "Rp90.000",
    nominal: 90000,
    koin: 230,
    durasiHari: 30,
    isVIP: true,
    ket: "230 Koin + Akses Penuh Semua Fitur VIP untuk Produksi Konten Harian.",
  },
]

export default function AuthFullscreen({ onAuthSuccess, onNotify }) {
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

  const [tipeAktivasi, setTipeAktivasi] = useState("berbayar")
  const [paketTerpilih, setPaketTerpilih] = useState(
    PILIHAN_PAKET_PENDAFTARAN[4],
  )
  const [kodeVoucherInput, setKodeVoucherInput] = useState("")
  const [invoiceReg, setInvoiceReg] = useState(null)

  const [buktiRegBase64, setBuktiRegBase64] = useState("")
  const [namaFileBuktiReg, setNamaFileBuktiReg] = useState("")

  const [paymentConfigDB, setPaymentConfigDB] = useState({
    modePembayaranAktif: "qris_manual",
    namaMerchant: "HOOKYA OFFICIAL",
    infoRekening: "QRIS / BCA / SeaBank / GoPay / DANA a.n Admin Hookya",
    noWaAdmin: "6281234567890",
    qrisImageUrl: "",
  })
  const [voucherListDB, setVoucherListDB] = useState([
    { kode: "HOOKYA20", koin: 20, kuota: 50, terpakai: 0 },
  ])

  const [errors, setErrors] = useState({})
  const [infoPesanHijau, setInfoPesanHijau] = useState("")

  useEffect(() => {
    const muatKonfigurasiAdmin = async () => {
      try {
        const { data: rows } = await supabase
          .from("users")
          .select("role, profil_dna")
          .order("created_at", { ascending: true })

        if (rows && rows.length > 0) {
          const rowDenganQRIS =
            rows.find((r) => r.profil_dna?.pengaturanPayment?.qrisImageUrl) ||
            rows.find(
              (r) => r.role === "admin" && r.profil_dna?.pengaturanPayment,
            ) ||
            rows.find((r) => r.profil_dna?.pengaturanPayment) ||
            rows[0]

          if (rowDenganQRIS?.profil_dna?.pengaturanPayment) {
            setPaymentConfigDB((prev) => ({
              ...prev,
              ...rowDenganQRIS.profil_dna.pengaturanPayment,
            }))
          }
          if (Array.isArray(rowDenganQRIS?.profil_dna?.daftarVoucher)) {
            setVoucherListDB(rowDenganQRIS.profil_dna.daftarVoucher)
          }
        }
      } catch {
        // Abaikan jika gagal koneksi awal
      }
    }
    muatKonfigurasiAdmin()
  }, [mode])

  const formatOtomatisGmail = (nilai) => {
    const bersih = nilai.trim().toLowerCase().replace(/\s+/g, "")
    if (!bersih) return ""
    if (!bersih.includes("@")) return `${bersih}@gmail.com`
    const [depan] = bersih.split("@")
    return `${depan}@gmail.com`
  }

  const buatAvatarDefaultGmail = (nama, email) => {
    const namaBersih = encodeURIComponent(nama || email || "User")
    return `https://ui-avatars.com/api/?name=${namaBersih}&background=d4f34a&color=14141f&bold=true&size=128`
  }

  const cekValidasiWhatsApp = (nomor) => {
    if (!nomor) return "Nomor WhatsApp wajib diisi."
    if (!/^\d+$/.test(nomor)) {
      return "Nomor WhatsApp hanya boleh berisi angka."
    }
    if (!nomor.startsWith("08") && !nomor.startsWith("628")) {
      return "Nomor WhatsApp wajib diawali angka 08 atau 628."
    }
    if (nomor.length < 10 || nomor.length > 14) {
      return "Panjang nomor WhatsApp wajib 10 sampai 13 angka."
    }
    return ""
  }

  const cekValidasiPassword = (pass) => {
    if (!pass) return "Password wajib diisi."
    if (pass.length < 8) {
      return `Password minimal wajib 8 karakter (saat ini ${pass.length}).`
    }
    return ""
  }

  const handleUploadBuktiPendaftaran = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNamaFileBuktiReg(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxDim = 750
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
        setBuktiRegBase64(dataUrl)
        setErrors((prev) => ({ ...prev, bayar: "" }))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleLanjutKePilihPaket = async (e) => {
    e.preventDefault()
    const errBaru = {}
    setInfoPesanHijau("")

    const emailFinal = formatOtomatisGmail(form.gmail)
    setForm((prev) => ({ ...prev, gmail: emailFinal }))

    if (!form.namaLengkap.trim())
      errBaru.namaLengkap = "Nama Lengkap wajib diisi."
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
        const vDitemukan = voucherListDB.find(
          (v) => v.kode.toUpperCase() === kodeBersih,
        )
        if (!vDitemukan || vDitemukan.terpakai >= vDitemukan.kuota) {
          setErrors({
            paket: "Kode voucher tidak ditemukan atau kuotanya sudah habis.",
          })
          setIsSubmitting(false)
          return
        }

        const koinVoucher = parseInt(vDitemukan.koin) || 20
        const avatarDefault = buatAvatarDefaultGmail(
          form.namaLengkap.trim(),
          form.gmail,
        )
        const expISO = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString()

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
              is_premium: koinVoucher >= 40,
              expired_at: expISO,
              email_verified: true,
              koin: koinVoucher,
              profil_dna: {
                nama: form.namaLengkap.trim(),
                username: form.username.trim().toLowerCase(),
                kontak: form.gmail,
                whatsapp: form.whatsapp,
                avatar_url: avatarDefault,
                is_premium: koinVoucher >= 40,
                expired_at: expISO,
                paketAktif: `Voucher ${kodeBersih}`,
              },
            },
          ])
          .select()
          .single()

        if (error) throw error
        if (onNotify)
          onNotify(`Voucher diaktifkan. Akun masuk dengan ${koinVoucher} Koin.`)
        onAuthSuccess(newUser)
        return
      }

      const kodeUnik = Math.floor(101 + Math.random() * 499)
      const nomorInv = `REG-${Date.now().toString().slice(-6)}`
      let duitkuUrl = ""

      if (paymentConfigDB.modePembayaranAktif === "duitku_gateway") {
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
              duitkuConfigClient: {
                merchantCode: paymentConfigDB.duitkuMerchantCode,
                apiKey: paymentConfigDB.duitkuApiKey,
                isProduction: paymentConfigDB.duitkuIsProduction,
              },
            }),
          })
          const dataPay = await resPay.json()
          if (dataPay.mode === "duitku" && dataPay.redirectUrl) {
            duitkuUrl = dataPay.redirectUrl
            window.open(dataPay.redirectUrl, "_blank")
          }
        } catch {
          // Fallback ke QRIS Statis Manual
        }
      }

      setBuktiRegBase64("")
      setNamaFileBuktiReg("")
      setInvoiceReg({
        invoiceId: nomorInv,
        namaPaket: paketTerpilih.nama,
        koin: paketTerpilih.koin,
        durasiHari: paketTerpilih.durasiHari || 30,
        isVIP: paketTerpilih.isVIP,
        nominalAsli: paketTerpilih.nominal,
        nominalUnik: paketTerpilih.nominal + kodeUnik,
        duitkuUrl,
      })
      setMode("register_step3_pay")
    } catch (err) {
      setErrors({ paket: "Gagal memproses paket: " + err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKonfirmasiPembayaranKeWAAdmin = async (e) => {
    e.preventDefault()
    if (!buktiRegBase64) {
      setErrors({
        bayar:
          "Unggah foto atau screenshot bukti pembayaran QRIS terlebih dahulu untuk diperiksa oleh Admin.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const avatarDefault = buatAvatarDefaultGmail(
        form.namaLengkap.trim(),
        form.gmail,
      )

      const { data: userPending, error: errUser } = await supabase
        .from("users")
        .insert([
          {
            nama: form.namaLengkap.trim(),
            username: form.username.trim().toLowerCase(),
            email: form.gmail,
            whatsapp: form.whatsapp,
            password_hash: form.password,
            avatar_url: avatarDefault,
            is_premium: false,
            email_verified: true,
            koin: 0,
            profil_dna: {
              nama: form.namaLengkap.trim(),
              username: form.username.trim().toLowerCase(),
              kontak: form.gmail,
              whatsapp: form.whatsapp,
              pin: form.password,
              avatar_url: avatarDefault,
              statusPendaftaran: "menunggu_acc_admin",
              paketDipilih: invoiceReg.namaPaket,
            },
          },
        ])
        .select()
        .single()

      if (errUser) throw errUser

      const infoAkunJSON = JSON.stringify({
        tipe: "PENDAFTARAN_BARU",
        username: form.username.trim().toLowerCase(),
        email: form.gmail,
        password: form.password,
        whatsapp: form.whatsapp,
        durasiHari: invoiceReg.durasiHari || 30,
        isVIP: invoiceReg.isVIP,
      })

      await supabase.from("transactions").insert([
        {
          invoice_id: invoiceReg.invoiceId,
          user_id: userPending.id,
          nama_user: form.namaLengkap.trim(),
          nama_paket: invoiceReg.namaPaket,
          jumlah_koin: invoiceReg.koin,
          nominal_asli: invoiceReg.nominalAsli,
          nominal_bayar: invoiceReg.nominalUnik,
          metode_bayar: "QRIS Pendaftaran (Menunggu ACC)",
          bukti_bayar: buktiRegBase64,
          catatan_user: infoAkunJSON,
          status: "pending",
        },
      ])

      const rawWA = (paymentConfigDB.noWaAdmin || "6281234567890").replace(
        /\D/g,
        "",
      )
      const waAdminFinal = rawWA.startsWith("08")
        ? "62" + rawWA.slice(1)
        : rawWA.startsWith("8")
          ? "62" + rawWA
          : rawWA

      const pesanKeAdmin = encodeURIComponent(
        `Halo Admin Hookya.\nSaya baru mendaftar akun dan sudah mengunggah bukti pembayaran QRIS di aplikasi:\n\n` +
          `No. Tagihan: *#${invoiceReg.invoiceId}*\n` +
          `Nama Lengkap: *${form.namaLengkap.trim()}*\n` +
          `Username: *${form.username.trim().toLowerCase()}*\n` +
          `Gmail: *${form.gmail}*\n` +
          `Paket Dipilih: *${invoiceReg.namaPaket} (+${invoiceReg.koin} Koin, ${invoiceReg.durasiHari} Hari)*\n` +
          `Nominal Transfer: *Rp${invoiceReg.nominalUnik.toLocaleString("id-ID")}*\n\n` +
          `Mohon diperiksa bukti pembayarannya dan diaktifkan di Dashboard Developer. Terima kasih.`,
      )

      window.open(
        `https://wa.me/${waAdminFinal}?text=${pesanKeAdmin}`,
        "_blank",
      )

      setMode("register_waiting_acc")
    } catch (err) {
      setErrors({
        bayar: "Gagal mengirim konfirmasi pendaftaran: " + err.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
            "Akun tidak ditemukan. Periksa penulisan Gmail/Username atau Daftar Akun Baru.",
        })
        setIsSubmitting(false)
        return
      }

      const passTersimpan =
        ditemukan.password_hash || ditemukan.profil_dna?.pin || ""
      if (passTersimpan && passTersimpan !== form.password) {
        setErrors({
          password:
            "Password yang kamu masukkan belum sesuai. Periksa kembali atau klik Lupa Password.",
        })
        setIsSubmitting(false)
        return
      }

      const isOwner =
        ditemukan.role === "admin" ||
        ditemukan.username?.toLowerCase() === "paqijoe" ||
        ditemukan.nama?.toLowerCase().includes("faqih")

      if (
        !isOwner &&
        (ditemukan.koin || 0) === 0 &&
        ditemukan.profil_dna?.statusPendaftaran === "menunggu_acc_admin"
      ) {
        setErrors({
          gmail:
            "Akunmu sedang menunggu pemeriksaan bukti pembayaran oleh Admin. Setelah di-ACC, kamu akan menerima pesan WhatsApp dan bisa langsung masuk.",
        })
        setIsSubmitting(false)
        return
      }

      if (onNotify) onNotify(`Selamat datang kembali, ${ditemukan.nama}.`)
      onAuthSuccess(ditemukan)
    } finally {
      setIsSubmitting(false)
    }
  }

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

      await supabase
        .from("users")
        .update({ password_hash: form.password })
        .eq("id", akunCocok.id)

      setInfoPesanHijau(
        "Password baru berhasil disimpan. Silakan masuk menggunakan password barumu.",
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
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#14141f] flex items-center justify-center text-[#d4f34a] font-bold text-2xl shadow-md">
            H
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#14141f]">
            Hookya
          </h1>
          <p className="text-xs font-normal text-slate-500">
            {mode === "login" &&
              "Masuk untuk mulai menyusun skrip konten dengan gaya bicaramu."}
            {mode === "register_step1" &&
              "Langkah 1 dari 3: Lengkapi data diri akun kreator barumu."}
            {mode === "register_step2_package" &&
              "Langkah 2 dari 3: Pilih paket koin aktivasi akunmu."}
            {mode === "register_step3_pay" &&
              "Langkah 3 dari 3: Scan QRIS dan unggah bukti pembayaran."}
            {mode === "register_waiting_acc" &&
              "Bukti pembayaran diterima dan sedang diperiksa oleh Admin."}
            {mode === "forgot_password" &&
              "Verifikasi Gmail dan WhatsApp terdaftar untuk membuat password baru."}
          </p>
        </div>

        {infoPesanHijau && (
          <div className="bg-[#f2fce2] border border-[#4d6b14]/25 text-[#4d6b14] p-3.5 rounded-2xl text-xs font-bold leading-relaxed">
            {infoPesanHijau}
          </div>
        )}

        {/* 1. FORM LOGIN */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Alamat Gmail atau Username
              </label>
              <input
                type="text"
                name="email"
                autoComplete="username email"
                value={form.gmail}
                onChange={(e) => {
                  setForm({ ...form, gmail: e.target.value })
                  setErrors({ ...errors, gmail: "" })
                }}
                placeholder="nama@gmail.com atau username"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-3 text-base sm:text-xs font-normal focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.gmail && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  {errors.gmail}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#14141f]">
                  Password
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
                    setErrors({ ...errors, password: "" })
                  }}
                  placeholder="Masukkan password..."
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-3 pr-11 text-base sm:text-xs font-normal focus:bg-white focus:border-[#14141f] outline-none"
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
                  {errors.password}
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

        {/* 2. PENDAFTARAN LANGKAH 1 */}
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
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.namaLengkap && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  {errors.namaLengkap}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Username (Untuk Login)
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
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.username && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Alamat Gmail
              </label>
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
                placeholder="nama@gmail.com"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.gmail && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  {errors.gmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Nomor WhatsApp Aktif (Untuk Pengiriman Info Akun & Koin)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.whatsapp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "")
                  setForm({ ...form, whatsapp: val })
                  setErrors({
                    ...errors,
                    whatsapp: val ? cekValidasiWhatsApp(val) : "",
                  })
                }}
                placeholder="Contoh: 081234567890"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs focus:bg-white focus:border-[#14141f] outline-none"
              />
              {errors.whatsapp && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">
                  {errors.whatsapp}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Buat Password (Minimal 8 Karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
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
                  className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 pr-11 text-base sm:text-xs focus:bg-white focus:border-[#14141f] outline-none"
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
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              {isSubmitting ? "Memeriksa Data..." : "Lanjut Pilih Paket Koin"}
            </button>
          </form>
        )}

        {/* 3. PENDAFTARAN LANGKAH 2: PILIH PAKET */}
        {mode === "register_step2_package" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1.5 bg-[#f4f5f7] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setTipeAktivasi("berbayar")}
                className={`cursor-pointer py-2 px-2 rounded-xl text-xs font-bold transition ${
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
                className={`cursor-pointer py-2 px-2 rounded-xl text-xs font-bold transition ${
                  tipeAktivasi === "voucher"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Pakai Kode Voucher
              </button>
            </div>

            {tipeAktivasi === "berbayar" && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {PILIHAN_PAKET_PENDAFTARAN.map((p) => {
                  const sedangDipilih = paketTerpilih.id === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaketTerpilih(p)}
                      className={`cursor-pointer w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                        sedangDipilih
                          ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                          : "bg-[#fafafa] text-[#14141f] border-slate-200"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold">
                            {p.nama}
                          </span>
                          <span className="text-[10px] font-bold bg-[#14141f] text-[#d4f34a] px-2 py-0.5 rounded-full">
                            +{p.koin} Koin
                          </span>
                          {p.isVIP && (
                            <span className="text-[10px] font-bold bg-white text-[#14141f] px-2 py-0.5 rounded-full border border-[#14141f]/20">
                              Fitur VIP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-700 leading-snug">
                          {p.ket}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold">{p.hargaTeks}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {tipeAktivasi === "voucher" && (
              <div className="bg-[#f4f5f7] p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-[#14141f]">
                  Masukkan Kode Voucher Undangan:
                </label>
                <input
                  type="text"
                  value={kodeVoucherInput}
                  onChange={(e) =>
                    setKodeVoucherInput(e.target.value.toUpperCase())
                  }
                  placeholder="Contoh: HOOKYA20"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-center text-base sm:text-sm font-bold uppercase tracking-widest outline-none"
                />
              </div>
            )}

            {errors.paket && (
              <p className="text-[11px] font-bold text-rose-600">
                {errors.paket}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("register_step1")}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] text-[#14141f] font-bold text-xs py-3.5 rounded-xl"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProsesPaketPendaftaran}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
              >
                {isSubmitting
                  ? "Memproses..."
                  : tipeAktivasi === "berbayar"
                    ? `Lanjut Pembayaran ${paketTerpilih.hargaTeks}`
                    : "Klaim Voucher & Masuk"}
              </button>
            </div>
          </div>
        )}

        {/* 4. PENDAFTARAN LANGKAH 3: SCAN QRIS STATIS + UPLOAD BUKTI + KE WA ADMIN */}
        {mode === "register_step3_pay" && invoiceReg && (
          <form
            onSubmit={handleKonfirmasiPembayaranKeWAAdmin}
            className="space-y-4"
          >
            <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold bg-[#14141f] text-[#d4f34a] px-2.5 py-1 rounded-md">
                  Tagihan #{invoiceReg.invoiceId}
                </span>
                <span className="font-bold text-[#4d6b14]">
                  {invoiceReg.namaPaket} (+{invoiceReg.koin} Koin)
                </span>
              </div>

              <div className="text-xs font-bold text-slate-600">
                1. Scan QRIS di Bawah Ini Sesuai Nominal:
              </div>

              {paymentConfigDB.qrisImageUrl ? (
                <img
                  src={paymentConfigDB.qrisImageUrl}
                  alt="QRIS Hookya"
                  className="w-56 h-56 mx-auto rounded-2xl object-contain bg-white p-2 border-2 border-[#14141f] shadow-xs"
                />
              ) : (
                <div className="w-48 h-48 mx-auto bg-white rounded-2xl border border-slate-300 flex flex-col items-center justify-center p-4 text-center">
                  <FlatIcon name="qr" className="w-20 h-20 text-[#14141f]" />
                  <span className="text-[10px] font-bold text-slate-500 mt-1">
                    QRIS {paymentConfigDB.namaMerchant}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[11px] text-slate-500 block">
                  Total Nominal Transfer:
                </span>
                <div className="text-2xl font-bold text-[#14141f]">
                  Rp{invoiceReg.nominalUnik.toLocaleString("id-ID")}
                </div>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  {paymentConfigDB.infoRekening}
                </span>
              </div>

              {invoiceReg.duitkuUrl && (
                <a
                  href={invoiceReg.duitkuUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-[#d4f34a] text-[#14141f] text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  Buka Halaman Payment Gateway
                </a>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#14141f]">
                2. Upload Foto / Screenshot Bukti Pembayaran (Wajib):
              </label>
              <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-2xl p-3.5 flex items-center gap-3 transition">
                {buktiRegBase64 ? (
                  <img
                    src={buktiRegBase64}
                    alt="Bukti Transfer"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-300 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center shrink-0">
                    <FlatIcon name="upload" className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-[#14141f] truncate">
                    {namaFileBuktiReg ||
                      "Klik untuk Upload Bukti Transfer QRIS"}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Bukti pembayaran akan diperiksa Admin di Dashboard Developer
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBuktiPendaftaran}
                  className="hidden"
                />
              </label>
            </div>

            {errors.bayar && (
              <p className="text-[11px] font-bold text-rose-600">
                {errors.bayar}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("register_step2_package")}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] text-[#14141f] font-bold text-xs py-3.5 rounded-xl"
              >
                Ganti Paket
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
              >
                {isSubmitting
                  ? "Mengirim Bukti..."
                  : "Konfirmasi Pembayaran ke WA Admin"}
              </button>
            </div>
          </form>
        )}

        {/* 5. LAYAR TUNGGU ACC ADMIN */}
        {mode === "register_waiting_acc" && invoiceReg && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-[#f2fce2] text-[#4d6b14] flex items-center justify-center mx-auto">
              <FlatIcon name="check" className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#14141f]">
              Bukti Pembayaran Terkirim ke Dashboard Admin
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Admin sedang memeriksa bukti transfer untuk{" "}
              <strong>{invoiceReg.namaPaket}</strong>. Setelah di-ACC, kamu akan
              menerima pesan WhatsApp berisi konfirmasi aktif beserta{" "}
              <strong>Username, Password, dan +{invoiceReg.koin} Koin</strong>{" "}
              untuk langsung Login.
            </p>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              Ke Halaman Login
            </button>
          </div>
        )}

        {/* 6. LUPA PASSWORD */}
        {mode === "forgot_password" && (
          <form onSubmit={handleResetPasswordPasti} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Alamat Gmail Terdaftar
              </label>
              <input
                type="email"
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
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Nomor WhatsApp Terdaftar
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.whatsapp}
                onChange={(e) => {
                  setForm({ ...form, whatsapp: e.target.value })
                  setErrors({})
                }}
                placeholder="Contoh: 081234567890"
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1">
                Buat Password Baru (Minimal 8 Karakter)
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 8 angka atau huruf..."
                className="w-full bg-[#fafafa] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              Simpan Password Baru
            </button>

            <button
              type="button"
              onClick={() => setMode("login")}
              className="cursor-pointer w-full text-xs font-bold text-slate-600 py-1"
            >
              Kembali ke Halaman Masuk
            </button>
          </form>
        )}
      </div>

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
