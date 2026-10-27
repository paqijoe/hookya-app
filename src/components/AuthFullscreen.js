"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { FlatIcon, HookyaLogo, hitungKuotaAkunDariPaket } from "./SharedUI"

const PILIHAN_PAKET_PENDAFTARAN = [
  {
    id: "5k",
    nama: "Paket 5K",
    hargaTeks: "Rp 5.000",
    nominal: 5000,
    koin: 10,
    kuotaAkun: 1,
    durasiHari: 30,
    isVIP: false,
  },
  {
    id: "10k",
    nama: "Paket 10K",
    hargaTeks: "Rp 10.000",
    nominal: 10000,
    koin: 20,
    kuotaAkun: 2,
    durasiHari: 30,
    isVIP: false,
  },
  {
    id: "15k",
    nama: "Paket 15K",
    hargaTeks: "Rp 15.000",
    nominal: 15000,
    koin: 30,
    kuotaAkun: 2,
    durasiHari: 30,
    isVIP: false,
  },
  {
    id: "20k",
    nama: "Paket 20K VIP",
    hargaTeks: "Rp 20.000",
    nominal: 20000,
    koin: 40,
    kuotaAkun: 2,
    durasiHari: 30,
    isVIP: true,
  },
  {
    id: "25k",
    nama: "Paket 25K VIP",
    hargaTeks: "Rp 25.000",
    nominal: 25000,
    koin: 55,
    kuotaAkun: 3,
    durasiHari: 30,
    isVIP: true,
    populer: true,
    badgeEkstra: "Best Value",
  },
  {
    id: "50k",
    nama: "Paket 50K VIP",
    hargaTeks: "Rp 50.000",
    nominal: 50000,
    koin: 120,
    kuotaAkun: 5,
    durasiHari: 30,
    isVIP: true,
  },
  {
    id: "90k",
    nama: "Paket 90K VIP",
    hargaTeks: "Rp 90.000",
    nominal: 90000,
    koin: 230,
    kuotaAkun: 10,
    durasiHari: 30,
    isVIP: true,
    badgeEkstra: "Ultimate",
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
    namaMerchant: "HOOKYA OFFICIAL STORE",
    infoRekening: "NMID: ID1024398129031",
    noWaAdmin: "6281234567890",
    qrisImageUrl: "",
    brandConfig: {
      logoPngUrl: "",
      logoGapPx: 6,
      brandText: "OOKYA",
      showBrandText: false,
    },
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
          const rowDenganConfig =
            rows.find(
              (r) =>
                r.profil_dna?.pengaturanPayment?.brandConfig?.logoPngUrl ||
                r.profil_dna?.pengaturanPayment?.qrisImageUrl,
            ) ||
            rows.find(
              (r) => r.role === "admin" && r.profil_dna?.pengaturanPayment,
            ) ||
            rows.find((r) => r.profil_dna?.pengaturanPayment) ||
            rows[0]

          if (rowDenganConfig?.profil_dna?.pengaturanPayment) {
            setPaymentConfigDB((prev) => ({
              ...prev,
              ...rowDenganConfig.profil_dna.pengaturanPayment,
            }))
          }
          if (Array.isArray(rowDenganConfig?.profil_dna?.daftarVoucher)) {
            setVoucherListDB(rowDenganConfig.profil_dna.daftarVoucher)
          }
        }
      } catch {
        // Fallback default config
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

  const normalisasiNomorWA = (input) => {
    const angka = (input || "").replace(/\D/g, "")
    if (!angka) return ""
    if (angka.startsWith("08")) return angka
    if (angka.startsWith("628")) return "0" + angka.slice(2)
    if (angka.startsWith("8")) return "0" + angka
    return angka
  }

  const cekValidasiWhatsApp = (nomorRaw) => {
    const nomor = normalisasiNomorWA(nomorRaw)
    if (!nomor) return "Nomor WhatsApp wajib diisi."
    if (nomor.length < 10 || nomor.length > 14) {
      return "Panjang nomor WhatsApp wajib 10 sampai 13 angka."
    }
    return ""
  }

  const cekValidasiPassword = (pass) => {
    if (!pass) return "Kata sandi wajib diisi."
    if (pass.length < 8) {
      return `Kata sandi minimal 8 karakter (saat ini ${pass.length}).`
    }
    return ""
  }

  const hitungKekuatanPassword = (val = "") => {
    if (!val) return { level: 0, teks: "Minimal 8 karakter" }
    if (val.length < 6) return { level: 1, teks: "Lemah" }
    if (val.length < 8) return { level: 2, teks: "Sedang" }
    return { level: 3, teks: "Kuat & Aman" }
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
    const waNormal = normalisasiNomorWA(form.whatsapp)
    setForm((prev) => ({ ...prev, gmail: emailFinal, whatsapp: waNormal }))

    if (!form.namaLengkap.trim())
      errBaru.namaLengkap = "Nama Lengkap wajib diisi."
    if (!form.username.trim() || form.username.trim().length < 3) {
      errBaru.username = "Username minimal 3 karakter tanpa spasi."
    }
    if (!emailFinal.endsWith("@gmail.com")) {
      errBaru.gmail = "Gunakan alamat @gmail.com yang aktif."
    }

    const pesanErrWA = cekValidasiWhatsApp(waNormal)
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
            "Username atau alamat Gmail ini sudah terdaftar. Silakan langsung Masuk.",
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
            paket: "Kode voucher tidak ditemukan atau kuota sudah habis.",
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
                kuotaAkunMaksimal: koinVoucher >= 40 ? 2 : 1,
              },
            },
          ])
          .select()
          .single()

        if (error) throw error
        if (onNotify)
          onNotify(`Voucher berhasil diklaim. Saldo awal: ${koinVoucher} Koin.`)
        onAuthSuccess(newUser)
        return
      }

      const kodeUnik = Math.floor(101 + Math.random() * 799)
      const nomorInv = `HKY-${Date.now().toString().slice(-5)}-QR`

      setBuktiRegBase64("")
      setNamaFileBuktiReg("")
      setInvoiceReg({
        invoiceId: nomorInv,
        namaPaket: paketTerpilih.nama,
        koin: paketTerpilih.koin,
        kuotaAkun: paketTerpilih.kuotaAkun,
        durasiHari: paketTerpilih.durasiHari || 30,
        isVIP: paketTerpilih.isVIP,
        nominalAsli: paketTerpilih.nominal,
        kodeUnik,
        nominalUnik: paketTerpilih.nominal + kodeUnik,
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
          "Unggah foto atau tangkapan layar bukti struk pembayaran QRIS terlebih dahulu.",
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
              kuotaAkunMaksimal: hitungKuotaAkunDariPaket(
                invoiceReg.namaPaket,
                invoiceReg.nominalAsli,
              ),
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
        kuotaAkun: invoiceReg.kuotaAkun,
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
          metode_bayar: "QRIS Pendaftaran (Menunggu Review)",
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
        `Halo Admin Hookya, saya sudah transfer untuk Invoice *#${invoiceReg.invoiceId}*:\n\n` +
          `Nama: *${form.namaLengkap.trim()}*\n` +
          `Username: *${form.username.trim().toLowerCase()}*\n` +
          `Gmail: *${form.gmail}*\n` +
          `Paket: *${invoiceReg.namaPaket} (+${invoiceReg.koin} Koin, ${invoiceReg.kuotaAkun} Akun)*\n` +
          `Nominal Transfer: *Rp ${invoiceReg.nominalUnik.toLocaleString("id-ID")}*\n\n` +
          `Mohon proses aktivasi koin akun saya. Terima kasih.`,
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
            "Akun tidak ditemukan. Periksa penulisan Gmail/Username atau Buat Akun Baru.",
        })
        setIsSubmitting(false)
        return
      }

      const passTersimpan =
        ditemukan.password_hash || ditemukan.profil_dna?.pin || ""
      if (passTersimpan && passTersimpan !== form.password) {
        setErrors({
          password:
            "Kata sandi yang kamu masukkan belum sesuai. Periksa kembali atau klik Lupa Password.",
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
            "Akunmu sedang menunggu verifikasi bukti pembayaran oleh Admin. Kamu akan menerima pesan WhatsApp begitu koin aktif.",
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
    const waNormal = normalisasiNomorWA(form.whatsapp)
    setForm((prev) => ({ ...prev, gmail: emailTarget, whatsapp: waNormal }))

    if (!emailTarget.endsWith("@gmail.com")) {
      errBaru.gmail = "Masukkan alamat @gmail.com yang terdaftar."
    }
    const errWA = cekValidasiWhatsApp(waNormal)
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
          (normalisasiNomorWA(u.whatsapp) === waNormal ||
            normalisasiNomorWA(u.profil_dna?.whatsapp) === waNormal),
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
        "Kata sandi baru berhasil disimpan. Silakan masuk menggunakan kata sandi barumu.",
      )
      setMode("login")
    } catch (err) {
      setErrors({ gmail: "Gagal memperbarui kata sandi: " + err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const infoPass = hitungKekuatanPassword(form.password)

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] text-[#14141F] flex flex-col justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-xl mx-auto">
        {infoPesanHijau && (
          <div className="mb-4 bg-[#F2FCE2] border border-[#4D6B14]/30 text-[#4D6B14] p-3.5 rounded-xl text-xs font-bold leading-relaxed">
            {infoPesanHijau}
          </div>
        )}

        {/* VIEW 1: MASUK (LOGIN VIEW DENGAN LOGO PNG & JARAK DINAMIS) */}
        {mode === "login" && (
          <section className="flex flex-col gap-4 py-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#C8C5CC]/70 flex flex-col gap-5">
              <div className="flex flex-col items-center text-center pt-2 pb-1">
                <div className="mb-3">
                  <HookyaLogo
                    brandConfig={paymentConfigDB.brandConfig}
                    isLoginScreen={true}
                  />
                </div>
                <h1 className="text-xl font-bold text-[#14141F]">
                  Masuk ke Hookya
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Gass... login dan mulai ngonten hari ini juga :D
                </p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="login-identifier"
                    className="text-sm font-semibold text-[#14141F]"
                  >
                    Alamat Gmail atau Username
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 pointer-events-none">
                      <FlatIcon name="at" className="w-5 h-5" />
                    </span>
                    <input
                      id="login-identifier"
                      type="text"
                      name="email"
                      autoComplete="username email"
                      value={form.gmail}
                      onChange={(e) => {
                        setForm({ ...form, gmail: e.target.value })
                        setErrors({ ...errors, gmail: "" })
                      }}
                      placeholder="nama@gmail.com atau username"
                      className="w-full h-12 pl-11 pr-4 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:border-[#14141F] focus:outline-none focus:ring-2 focus:ring-[#D4F34A] transition"
                    />
                  </div>
                  {errors.gmail && (
                    <p className="text-xs font-bold text-rose-600 mt-0.5">
                      {errors.gmail}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="text-sm font-semibold text-[#14141F]"
                    >
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({})
                        setInfoPesanHijau("")
                        setMode("forgot_password")
                      }}
                      className="cursor-pointer text-xs font-semibold text-[#14141F] hover:underline py-1"
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 pointer-events-none">
                      <FlatIcon name="lock" className="w-5 h-5" />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value })
                        setErrors({ ...errors, password: "" })
                      }}
                      placeholder="Masukkan kata sandi akun"
                      className="w-full h-12 pl-11 pr-12 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:border-[#14141F] focus:outline-none focus:ring-2 focus:ring-[#D4F34A] transition"
                    />
                    <button
                      type="button"
                      aria-label="Lihat kata sandi"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer absolute right-1 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-[#14141F]"
                    >
                      <FlatIcon
                        name={showPassword ? "eyeOff" : "eye"}
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-bold text-rose-600 mt-0.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer w-full h-12 mt-1 bg-[#14141F] text-[#D4F34A] text-sm font-bold rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <span>
                    {isSubmitting ? "Memeriksa Akun..." : "Masuk ke Hookya"}
                  </span>
                  <FlatIcon name="arrowRight" className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5 pt-2 text-center text-sm">
                  <span className="text-slate-600">Belum punya akun?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({})
                      setInfoPesanHijau("")
                      setMode("register_step1")
                    }}
                    className="cursor-pointer font-bold text-[#14141F] hover:underline"
                  >
                    Buat Akun Baru
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* VIEW 2: DAFTAR LANGKAH 1 (DATA DIRI) */}
        {mode === "register_step1" && (
          <section className="flex flex-col gap-4 py-4">
            <div className="bg-white rounded-2xl p-4 border border-[#C8C5CC]/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Langkah Registrasi
                </span>
                <h2 className="text-lg font-bold text-[#14141F]">
                  Langkah 1 dari 3: Data Diri
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#D4F34A] text-[#14141F] text-xs font-bold">
                Akun Baru
              </span>
            </div>

            <form
              onSubmit={handleLanjutKePilihPaket}
              className="bg-white rounded-2xl p-5 border border-[#C8C5CC]/70 flex flex-col gap-3.5"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#14141F]">
                  Nama Lengkap
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500">
                    <FlatIcon name="user" className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={form.namaLengkap}
                    onChange={(e) => {
                      setForm({ ...form, namaLengkap: e.target.value })
                      setErrors({ ...errors, namaLengkap: "" })
                    }}
                    placeholder="Masukkan nama lengkapmu"
                    className="w-full h-12 pl-10 pr-4 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:border-[#14141F] focus:outline-none"
                  />
                </div>
                {errors.namaLengkap && (
                  <p className="text-xs font-bold text-rose-600">
                    {errors.namaLengkap}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#14141F]">
                  Username Hookya
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500">
                    <FlatIcon name="at" className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => {
                      const val = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9._]/g, "")
                      setForm({ ...form, username: val })
                      setErrors({ ...errors, username: "" })
                    }}
                    placeholder="username tanpa spasi"
                    className="w-full h-12 pl-10 pr-4 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:border-[#14141F] focus:outline-none"
                  />
                </div>
                {errors.username && (
                  <p className="text-xs font-bold text-rose-600">
                    {errors.username}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#14141F]">
                  Alamat Gmail Aktif
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500">
                    <FlatIcon name="mail" className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
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
                    className="w-full h-12 pl-10 pr-4 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:border-[#14141F] focus:outline-none"
                  />
                </div>
                {errors.gmail && (
                  <p className="text-xs font-bold text-rose-600">
                    {errors.gmail}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#14141F]">
                  Nomor WhatsApp Aktif
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-xs font-bold text-[#14141F] pr-2.5 border-r border-[#C8C5CC]">
                    <span>+62</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.whatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      setForm({ ...form, whatsapp: val })
                      setErrors({ ...errors, whatsapp: "" })
                    }}
                    placeholder="81234567890"
                    className="w-full h-12 pl-16 pr-4 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:border-[#14141F] focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Notifikasi invoice QRIS dan kredensial dikirim via WhatsApp.
                </span>
                {errors.whatsapp && (
                  <p className="text-xs font-bold text-rose-600">
                    {errors.whatsapp}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#14141F]">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500">
                    <FlatIcon name="lock" className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value })
                      setErrors({ ...errors, password: "" })
                    }}
                    placeholder="Minimal 8 karakter kombinasi"
                    className="w-full h-12 pl-10 pr-12 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:border-[#14141F] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-1 w-11 h-11 flex items-center justify-center text-slate-500"
                  >
                    <FlatIcon
                      name={showPassword ? "eyeOff" : "eye"}
                      className="w-4 h-4"
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <div
                    className={`h-1.5 flex-1 rounded transition-colors ${
                      infoPass.level >= 1
                        ? infoPass.level === 1
                          ? "bg-rose-500"
                          : "bg-[#D4F34A]"
                        : "bg-slate-200"
                    }`}
                  />
                  <div
                    className={`h-1.5 flex-1 rounded transition-colors ${
                      infoPass.level >= 2 ? "bg-[#D4F34A]" : "bg-slate-200"
                    }`}
                  />
                  <div
                    className={`h-1.5 flex-1 rounded transition-colors ${
                      infoPass.level >= 3 ? "bg-[#4D6B14]" : "bg-slate-200"
                    }`}
                  />
                  <span className="text-[11px] font-medium text-slate-500 pl-1">
                    {infoPass.teks}
                  </span>
                </div>
                {errors.password && (
                  <p className="text-xs font-bold text-rose-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer w-full h-12 mt-2 bg-[#14141F] text-[#D4F34A] text-sm font-bold rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <span>
                  {isSubmitting
                    ? "Memeriksa Data..."
                    : "Lanjut Pilih Paket Koin"}
                </span>
                <FlatIcon name="arrowRight" className="w-4 h-4" />
              </button>
            </form>

            <div className="flex justify-center items-center py-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="cursor-pointer text-sm text-slate-600 hover:text-[#14141F] min-h-[44px] flex items-center gap-1.5"
              >
                <span>Sudah punya akun?</span>
                <span className="text-[#14141F] font-bold underline">
                  Masuk di sini
                </span>
              </button>
            </div>
          </section>
        )}

        {/* VIEW 3: LANGKAH 2 DARI 3 (PILIH PAKET KOIN ATAU KODE VOUCHER) */}
        {mode === "register_step2_package" && (
          <section className="flex flex-col gap-4 py-4">
            <div className="bg-white rounded-2xl p-4 border border-[#C8C5CC]/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Aktivasi Koin
                </span>
                <h2 className="text-lg font-bold text-[#14141F]">
                  Langkah 2 dari 3: Pilih Paket
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#F4F5F7] text-[#14141F] text-xs font-bold border border-[#E2E8F0]">
                7 Pilihan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4F5F7] rounded-xl border border-[#C8C5CC]/70">
              <button
                type="button"
                onClick={() => setTipeAktivasi("berbayar")}
                className={`cursor-pointer h-11 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  tipeAktivasi === "berbayar"
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-white text-[#14141F]"
                }`}
              >
                <span>Pilih Paket Koin</span>
              </button>
              <button
                type="button"
                onClick={() => setTipeAktivasi("voucher")}
                className={`cursor-pointer h-11 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  tipeAktivasi === "voucher"
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-white text-[#14141F]"
                }`}
              >
                <span>Pakai Kode Voucher</span>
              </button>
            </div>

            {tipeAktivasi === "voucher" && (
              <div className="bg-white rounded-2xl p-5 border border-[#C8C5CC]/70 flex flex-col gap-3">
                <div className="text-sm font-bold text-[#14141F]">
                  Penebusan Voucher Langsung
                </div>
                <div className="border border-dashed border-[#C8C5CC] rounded-xl p-2 bg-[#F4F5F7] flex items-center gap-2">
                  <input
                    type="text"
                    value={kodeVoucherInput}
                    onChange={(e) =>
                      setKodeVoucherInput(e.target.value.toUpperCase())
                    }
                    placeholder="HKY-PROMO-XXXX"
                    className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg font-mono text-sm font-bold uppercase text-[#14141F] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleProsesPaketPendaftaran}
                    className="cursor-pointer h-11 px-5 bg-[#D4F34A] text-[#14141F] text-xs font-bold rounded-lg shrink-0"
                  >
                    Klaim
                  </button>
                </div>
                <span className="text-[11px] text-slate-500">
                  Koin langsung ditambahkan ke saldo akun Anda tanpa pembayaran
                  QRIS tambahan.
                </span>
              </div>
            )}

            {tipeAktivasi === "berbayar" && (
              <>
                <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {PILIHAN_PAKET_PENDAFTARAN.map((p) => {
                    const terpilih = paketTerpilih.id === p.id
                    return (
                      <label
                        key={p.id}
                        onClick={() => setPaketTerpilih(p)}
                        className={`flex items-center justify-between p-3.5 bg-white rounded-xl cursor-pointer transition ${
                          terpilih
                            ? "border-2 border-[#14141F]"
                            : "border border-[#C8C5CC]/80 hover:border-[#14141F]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selected_coin_pack"
                            checked={terpilih}
                            onChange={() => setPaketTerpilih(p)}
                            className="w-5 h-5 accent-[#14141F] cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-[#14141F]">
                                {p.nama}
                              </span>
                              {p.isVIP && (
                                <span className="px-2 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-bold">
                                  VIP
                                </span>
                              )}
                              {p.badgeEkstra && (
                                <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] text-[10px] font-bold">
                                  {p.badgeEkstra}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {p.koin} Koin / {p.kuotaAkun} Akun
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#14141F]">
                          {p.hargaTeks}
                        </span>
                      </label>
                    )
                  })}
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#C8C5CC]/70 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Paket Terpilih:</span>
                    <span className="font-bold text-sm text-[#14141F]">
                      {paketTerpilih.nama}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      Alokasi Koin & Kuota:
                    </span>
                    <span className="font-bold text-[#14141F]">
                      {paketTerpilih.koin} Koin • {paketTerpilih.kuotaAkun} Akun
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-[#14141F]">
                      Estimasi Biaya:
                    </span>
                    <span className="text-lg font-bold text-[#14141F]">
                      {paketTerpilih.hargaTeks}
                    </span>
                  </div>

                  {errors.paket && (
                    <p className="text-xs font-bold text-rose-600">
                      {errors.paket}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("register_step1")}
                      className="cursor-pointer w-1/3 h-12 bg-[#F4F5F7] text-[#14141F] text-xs font-bold rounded-lg"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleProsesPaketPendaftaran}
                      className="cursor-pointer flex-1 h-12 bg-[#14141F] text-[#D4F34A] text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition"
                    >
                      <span>Lanjut ke Pembayaran QRIS</span>
                      <FlatIcon name="qr" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* VIEW 4: LANGKAH 3 DARI 3 (QRIS & UPLOAD BUKTI) */}
        {mode === "register_step3_pay" && invoiceReg && (
          <form
            onSubmit={handleKonfirmasiPembayaranKeWAAdmin}
            className="flex flex-col gap-4 py-4"
          >
            <div className="bg-white rounded-2xl p-4 border border-[#C8C5CC]/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Verifikasi Pembayaran
                </span>
                <h2 className="text-lg font-bold text-[#14141F]">
                  Langkah 3 dari 3: QRIS & Bukti
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#D4F34A] text-[#14141F] text-xs font-bold">
                Instan
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#C8C5CC]/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Nomor Invoice
                </span>
                <span className="text-sm font-bold text-[#14141F] font-mono">
                  #{invoiceReg.invoiceId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F5F7] border border-[#E2E8F0]">
                <span className="w-2 h-2 rounded-full bg-[#4D6B14]" />
                <span className="text-xs font-semibold text-[#14141F]">
                  Menunggu Bukti
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#C8C5CC]/70 flex flex-col items-center gap-4">
              <div className="text-center">
                <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold block">
                  QRIS NASIONAL
                </span>
                <h3 className="text-sm font-bold text-[#14141F] mt-0.5">
                  {paymentConfigDB.namaMerchant || "HOOKYA OFFICIAL STORE"}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {paymentConfigDB.infoRekening}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#C8C5CC] flex items-center justify-center">
                {paymentConfigDB.qrisImageUrl ? (
                  <img
                    src={paymentConfigDB.qrisImageUrl}
                    alt="QRIS Hookya"
                    className="w-52 h-52 object-contain rounded-lg"
                  />
                ) : (
                  <FlatIcon name="qr" className="w-40 h-40 text-[#14141F]" />
                )}
              </div>

              <p className="text-xs text-slate-500 text-center max-w-xs">
                Buka BCA, Mandiri, BRI, BNI, Dana, GoPay, OVO, atau ShopeePay
                untuk memindai kode QRIS di atas.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#C8C5CC]/70 flex flex-col gap-2">
              <span className="text-xs text-slate-500">
                Jumlah Total yang Harus Ditransfer:
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-bold text-[#14141F]">
                    Rp{" "}
                    {Math.floor(invoiceReg.nominalUnik / 1000).toLocaleString(
                      "id-ID",
                    )}
                    .
                  </span>
                  <span className="text-2xl font-extrabold text-[#14141F] font-mono bg-[#D4F34A] px-1.5 py-0.5 rounded">
                    {String(invoiceReg.nominalUnik).slice(-3)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      String(invoiceReg.nominalUnik),
                    )
                    if (onNotify)
                      onNotify(
                        `Nominal Rp ${invoiceReg.nominalUnik.toLocaleString("id-ID")} disalin.`,
                      )
                  }}
                  className="cursor-pointer h-10 px-3.5 bg-[#F4F5F7] hover:bg-slate-200 rounded-lg text-[#14141F] text-xs font-bold flex items-center gap-1.5"
                >
                  <FlatIcon name="copy" className="w-4 h-4" />
                  <span>Salin</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F4F5F7] border border-[#E2E8F0] text-[11px] text-slate-600">
                Penting: Mohon sertakan tepat hingga 3 digit kode unik (
                <strong className="text-[#14141F]">
                  {String(invoiceReg.nominalUnik).slice(-3)}
                </strong>
                ) agar Admin memvalidasi koin Anda dengan cepat.
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#C8C5CC]/70 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#14141F]">
                  Unggah Bukti Struk Pembayaran
                </span>
                <span className="text-rose-600">*Wajib</span>
              </div>

              <label className="cursor-pointer border border-dashed border-[#C8C5CC] hover:border-[#14141F] bg-[#F4F5F7] rounded-xl p-5 flex flex-col items-center justify-center text-center transition min-h-[120px]">
                {buktiRegBase64 ? (
                  <img
                    src={buktiRegBase64}
                    alt="Bukti Transfer"
                    className="w-20 h-20 rounded-lg object-cover border border-slate-300 mb-2"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#14141F] mb-2">
                    <FlatIcon name="upload" className="w-5 h-5" />
                  </div>
                )}
                <span className="text-xs font-bold text-[#14141F]">
                  {namaFileBuktiReg
                    ? namaFileBuktiReg
                    : "Tap untuk Pilih Bukti Transfer"}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Mendukung format JPG atau PNG
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBuktiPendaftaran}
                  className="hidden"
                />
              </label>

              {errors.bayar && (
                <p className="text-xs font-bold text-rose-600">
                  {errors.bayar}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("register_step2_package")}
                  className="cursor-pointer w-1/3 h-12 bg-[#F4F5F7] text-[#14141F] text-xs font-bold rounded-lg"
                >
                  Ubah Paket
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer flex-1 h-12 bg-[#D4F34A] text-[#14141F] font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition"
                >
                  <span>
                    {isSubmitting
                      ? "Mengirim Bukti..."
                      : "Konfirmasi Pembayaran ke WA Admin"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* VIEW 5: MENUNGGU ACC ADMIN */}
        {mode === "register_waiting_acc" && invoiceReg && (
          <div className="bg-white rounded-2xl p-6 border border-[#C8C5CC]/70 space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F2FCE2] text-[#4D6B14] flex items-center justify-center mx-auto">
              <FlatIcon name="check" className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#14141F]">
              Bukti Pembayaran Terkirim ke Admin
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Admin sedang memeriksa bukti transfer untuk{" "}
              <strong>{invoiceReg.namaPaket}</strong>. Begitu di-ACC, kamu akan
              menerima pesan WhatsApp berisi konfirmasi aktif beserta{" "}
              <strong>Username, Password, dan +{invoiceReg.koin} Koin</strong>.
            </p>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="cursor-pointer w-full h-12 bg-[#14141F] text-[#D4F34A] font-bold text-xs rounded-lg"
            >
              Ke Halaman Masuk
            </button>
          </div>
        )}

        {/* VIEW 6: LUPA PASSWORD */}
        {mode === "forgot_password" && (
          <form
            onSubmit={handleResetPasswordPasti}
            className="bg-white rounded-2xl p-6 border border-[#C8C5CC]/70 space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-[#14141F]">
                Atur Ulang Kata Sandi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan alamat Gmail dan nomor WhatsApp yang terdaftar pada
                akunmu.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141F] mb-1">
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
                className="w-full h-12 bg-white border border-[#C8C5CC] rounded-lg px-3.5 text-base sm:text-sm outline-none focus:border-[#14141F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141F] mb-1">
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
                className="w-full h-12 bg-white border border-[#C8C5CC] rounded-lg px-3.5 text-base sm:text-sm outline-none focus:border-[#14141F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141F] mb-1">
                Buat Kata Sandi Baru (Minimal 8 Karakter)
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 8 karakter..."
                className="w-full h-12 bg-white border border-[#C8C5CC] rounded-lg px-3.5 text-base sm:text-sm outline-none focus:border-[#14141F]"
              />
            </div>

            {errors.gmail && (
              <p className="text-xs font-bold text-rose-600">{errors.gmail}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full h-12 bg-[#14141F] text-[#D4F34A] font-bold text-xs rounded-lg"
            >
              Simpan Kata Sandi Baru
            </button>

            <button
              type="button"
              onClick={() => setMode("login")}
              className="cursor-pointer w-full text-xs font-bold text-slate-600 py-2"
            >
              Kembali ke Halaman Masuk
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
