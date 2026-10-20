"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { FlatIcon } from "./SharedUI";

const PILIHAN_PAKET_PENDAFTARAN = [
  {
    id: "coba",
    nama: "Paket Coba",
    hargaTeks: "Rp5.000",
    nominal: 5000,
    koin: 50,
    label: "Hemat untuk Pemula",
    ket: "Langsung dapat 50 Koin untuk membuat puluhan skrip & ekstrak video.",
  },
  {
    id: "pemula",
    nama: "Paket Pemula",
    hargaTeks: "Rp10.000",
    nominal: 10000,
    koin: 120,
    label: "Rutin Ngonten",
    ket: "120 Koin aktif 30 hari untuk kebutuhan konten harian.",
  },
  {
    id: "kreator",
    nama: "Paket Kreator (Terlaris)",
    hargaTeks: "Rp25.000",
    nominal: 25000,
    koin: 400,
    label: "PALING LARIS",
    populer: true,
    ket: "400 Koin penuh untuk kreator & affiliator yang serius mengejar komisi.",
  },
  {
    id: "sultan",
    nama: "Paket Sultan",
    hargaTeks: "Rp50.000",
    nominal: 50000,
    koin: 1000,
    label: "Produksi Masif",
    ket: "1.000 Koin untuk tim kreatif atau pemilik banyak akun TikTok/Reels.",
  },
];

export default function AuthFullscreen({ onAuthSuccess, onNotify }) {
  // mode: 'login' | 'register_step1' | 'register_step2_package' | 'register_step3_pay_verify' | 'forgot_request' | 'forgot_verify'
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    namaLengkap: "",
    username: "",
    gmail: "",
    konfirmasiGmail: "",
    whatsapp: "",
    password: "",
  });

  // State Pemilihan Paket saat Pendaftaran
  // tipeAktivasi: 'berbayar' | 'voucher' | 'tester'
  const [tipeAktivasi, setTipeAktivasi] = useState("berbayar");
  const [paketTerpilih, setPaketTerpilih] = useState(
    PILIHAN_PAKET_PENDAFTARAN[2]
  ); // Default: Paket Kreator Rp25.000
  const [kodeVoucherInput, setKodeVoucherInput] = useState("");
  const [invoiceReg, setInvoiceReg] = useState(null);
  const [sudahKlikBayar, setSudahKlikBayar] = useState(false);

  const [errors, setErrors] = useState({});
  const [inputKodeOTP, setInputKodeOTP] = useState("");
  const [infoPesanHijau, setInfoPesanHijau] = useState("");

  // Otomatis melengkapi @gmail.com
  const formatOtomatisGmail = (nilai) => {
    const bersih = nilai.trim().toLowerCase().replace(/\s+/g, "");
    if (!bersih) return "";
    if (!bersih.includes("@")) {
      return `${bersih}@gmail.com`;
    }
    const [depan] = bersih.split("@");
    return `${depan}@gmail.com`;
  };

  // Validasi Spesifik Nomor WhatsApp (Wajib 11-13 Angka, Diawali 08 atau 628)
  const cekValidasiWhatsApp = (nomor) => {
    if (!nomor) return "Nomor WhatsApp wajib diisi.";
    if (!/^\d+$/.test(nomor)) {
      return "Nomor WhatsApp hanya boleh berisi angka tanpa spasi atau tanda baca.";
    }
    if (!nomor.startsWith("08") && !nomor.startsWith("628")) {
      return "Format salah: Nomor WhatsApp wajib diawali angka 08 atau 628.";
    }
    if (nomor.length < 11) {
      return `Nomor kurang panjang: Saat ini baru ${nomor.length} angka (Wajib 11 atau 12 angka).`;
    }
    if (nomor.length > 13) {
      return `Nomor terlalu panjang: Saat ini ${nomor.length} angka (Maksimal 12-13 angka).`;
    }
    return "";
  };

  // Validasi Spesifik Password (Minimal 8 Angka/Karakter)
  const cekValidasiPassword = (pass) => {
    if (!pass) return "Password wajib diisi.";
    if (pass.length < 8) {
      return `Password kurang panjang: Baru ${pass.length} karakter (Minimal wajib 8 angka/karakter).`;
    }
    return "";
  };

  // ============================================================================
  // LANGKAH 1 PENDAFTARAN: VALIDASI DATA DIRI -> LANJUT KE PILIH PAKET
  // ============================================================================
  const handleLanjutKePilihPaket = async (e) => {
    e.preventDefault();
    const errBaru = {};
    setInfoPesanHijau("");

    const emailFinal = formatOtomatisGmail(form.gmail);
    const konfirmasiFinal = formatOtomatisGmail(form.konfirmasiGmail);

    setForm((prev) => ({
      ...prev,
      gmail: emailFinal,
      konfirmasiGmail: konfirmasiFinal,
    }));

    if (!form.namaLengkap.trim()) {
      errBaru.namaLengkap = "Nama Lengkap wajib diisi.";
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      errBaru.username = "Username minimal 3 karakter tanpa spasi.";
    }
    if (!emailFinal.endsWith("@gmail.com")) {
      errBaru.gmail = "Wajib menggunakan alamat @gmail.com yang valid.";
    }
    if (emailFinal !== konfirmasiFinal) {
      errBaru.konfirmasiGmail =
        "Konfirmasi Gmail tidak sama dengan alamat Gmail di atas.";
    }

    const pesanErrWA = cekValidasiWhatsApp(form.whatsapp);
    if (pesanErrWA) errBaru.whatsapp = pesanErrWA;

    const pesanErrPass = cekValidasiPassword(form.password);
    if (pesanErrPass) errBaru.password = pesanErrPass;

    setErrors(errBaru);
    if (Object.keys(errBaru).length > 0) return;

    setIsSubmitting(true);
    try {
      const { data: existingUsers } = await supabase
        .from("users")
        .select("id, username, email")
        .or(
          `username.eq.${form.username.trim().toLowerCase()},email.eq.${emailFinal}`
        );

      if (existingUsers && existingUsers.length > 0) {
        setErrors({
          gmail:
            "Username atau alamat Gmail ini sudah terdaftar. Silakan langsung Masuk (Login).",
        });
        setIsSubmitting(false);
        return;
      }

      setMode("register_step2_package");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // LANGKAH 2 PENDAFTARAN: PROSES PILIHAN PAKET & KIRIM KONFIRMASI GMAIL
  // ============================================================================
  const handleProsesPaketDanKirimGmail = async () => {
    setErrors({});
    setIsSubmitting(true);

    try {
      let koinAwal = 2; // Default jika memilih mode tester (cukup 1x coba buat skrip)
      let namaPaketAktif = "Akun Tester (2 Koin)";

      if (tipeAktivasi === "voucher") {
        const kodeBersih = kodeVoucherInput.trim().toUpperCase();
        if (!kodeBersih) {
          setErrors({
            paket: "Masukkan kode voucher terlebih dahulu.",
          });
          setIsSubmitting(false);
          return;
        }
        // Cek voucher dari database admin
        const { data: adminRows } = await supabase
          .from("users")
          .select("profil_dna")
          .order("created_at", { ascending: true })
          .limit(1);

        const listVoucher =
          adminRows?.[0]?.profil_dna?.daftarVoucher || [
            { kode: "HOOKYA100", koin: 100, kuota: 50, terpakai: 0 },
            { kode: "GRATIS50", koin: 50, kuota: 100, terpakai: 0 },
          ];

        const vDitemukan = listVoucher.find(
          (v) => v.kode.toUpperCase() === kodeBersih
        );
        if (!vDitemukan || vDitemukan.terpakai >= vDitemukan.kuota) {
          setErrors({
            paket: "Kode voucher tidak ditemukan atau kuotanya sudah habis.",
          });
          setIsSubmitting(false);
          return;
        }
        koinAwal = parseInt(vDitemukan.koin) || 50;
        namaPaketAktif = `Voucher ${kodeBersih}`;
      } else if (tipeAktivasi === "berbayar") {
        koinAwal = paketTerpilih.koin;
        namaPaketAktif = paketTerpilih.nama;

        // Buat nomor invoice & panggil Midtrans Gateway
        const kodeUnik = Math.floor(101 + Math.random() * 890);
        const nomorInv = `REG-${Date.now().toString().slice(-6)}`;
        let midtransUrl = "";

        try {
          const resPay = await fetch("/api/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create_gateway_invoice",
              invoiceId: nomorInv,
              namaUser: form.namaLengkap.trim(),
              namaPaket: paketTerpilih.nama,
              jumlahKoin: paketTerpilih.koin,
              nominal: paketTerpilih.nominal,
            }),
          });
          const dataPay = await resPay.json();
          if (dataPay.mode === "midtrans" && dataPay.redirectUrl) {
            midtransUrl = dataPay.redirectUrl;
            window.open(dataPay.redirectUrl, "_blank");
          }
        } catch {
          // Gunakan QRIS internal jika Midtrans belum siap
        }

        setInvoiceReg({
          invoiceId: nomorInv,
          namaPaket: paketTerpilih.nama,
          koin: paketTerpilih.koin,
          nominalAsli: paketTerpilih.nominal,
          nominalUnik: paketTerpilih.nominal + kodeUnik,
          midtransUrl,
        });
      }

      // Kirim email konfirmasi otomatis lewat Supabase Auth ke Gmail pendaftar
      const { data: signUpData, error: signUpErr } =
        await supabase.auth.signUp({
          email: form.gmail,
          password: form.password,
          options: {
            data: {
              full_name: form.namaLengkap.trim(),
              username: form.username.trim().toLowerCase(),
              whatsapp: form.whatsapp,
              initial_coins: koinAwal,
              package_name: namaPaketAktif,
            },
          },
        });

      if (signUpErr) {
        throw new Error(signUpErr.message);
      }

      // Jika bukan paket berbayar dan Supabase langsung memberikan session aktif
      if (tipeAktivasi !== "berbayar" && signUpData?.session) {
        await selesaikanSimpanUserBaru(koinAwal, namaPaketAktif, null);
        return;
      }

      setMode("register_step3_pay_verify");
      setInfoPesanHijau(
        `Email konfirmasi telah dikirim ke ${form.gmail}. Selesaikan langkah aktivasi di bawah untuk langsung masuk ke Hookya.`
      );
    } catch (err) {
      setErrors({
        paket: "Kendala pendaftaran: " + err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simpan user baru beserta transaksi paket awal ke Supabase
  const selesaikanSimpanUserBaru = async (
    jumlahKoinAwal,
    namaPaketAwal,
    dataInvoice
  ) => {
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
          koin: jumlahKoinAwal,
          profil_dna: {
            nama: form.namaLengkap.trim(),
            username: form.username.trim().toLowerCase(),
            kontak: form.gmail,
            whatsapp: form.whatsapp,
            paketAktif: namaPaketAwal,
            email_verified: true,
          },
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Jika mendaftar dengan membeli paket, catat ke tabel transactions
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
            metode_bayar: dataInvoice.midtransUrl
              ? "Midtrans Pendaftaran"
              : "QRIS Pendaftaran",
            status: "lunas",
          },
        ]);
      } catch {
        // Abaikan jika tabel belum siap
      }
    }

    if (onNotify) {
      onNotify(
        `Akun aktif dengan ${jumlahKoinAwal} Koin! Selamat datang, ${form.namaLengkap}.`
      );
    }
    onAuthSuccess(newUser);
  };

  // ============================================================================
  // LANGKAH 3 PENDAFTARAN: VERIFIKASI GMAIL & PEMBAYARAN PAKET AWAL
  // ============================================================================
  const handleVerifikasiAkhirPendaftaran = async (e) => {
    e.preventDefault();
    setErrors({});

    if (tipeAktivasi === "berbayar" && !sudahKlikBayar) {
      setErrors({
        otp: "Silakan selesaikan pembayaran paket dan centang 'Saya sudah melakukan pembayaran paket ini' terlebih dahulu.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const koinFinal =
        tipeAktivasi === "berbayar"
          ? paketTerpilih.koin
          : tipeAktivasi === "voucher"
          ? 100
          : 2;

      const namaPaketFinal =
        tipeAktivasi === "berbayar"
          ? paketTerpilih.nama
          : tipeAktivasi === "voucher"
          ? `Voucher ${kodeVoucherInput.toUpperCase()}`
          : "Akun Tester (2 Koin)";

      if (inputKodeOTP.trim().length >= 6) {
        const { error: otpErr } = await supabase.auth.verifyOtp({
          email: form.gmail,
          token: inputKodeOTP.trim(),
          type: "signup",
        });
        if (otpErr) {
          throw new Error(
            "Kode OTP belum sesuai. Silakan periksa kembali email di Gmail kamu."
          );
        }
        await selesaikanSimpanUserBaru(koinFinal, namaPaketFinal, invoiceReg);
        return;
      }

      const { data: signInData, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email: form.gmail,
          password: form.password,
        });

      if (signInErr || !signInData?.session) {
        throw new Error(
          "Konfirmasi Gmail belum terdeteksi. Silakan buka aplikasi Gmail dan klik tautan konfirmasi yang kami kirim, atau masukkan 6 angka kode OTP."
        );
      }

      await selesaikanSimpanUserBaru(koinFinal, namaPaketFinal, invoiceReg);
    } catch (err) {
      setErrors({ otp: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // LOGIN & LUPA PASSWORD
  // ============================================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    const errBaru = {};
    const identitas = form.gmail.trim().toLowerCase();

    if (!identitas) {
      errBaru.gmail = "Masukkan Username atau alamat Gmail kamu.";
    }
    const errPass = cekValidasiPassword(form.password);
    if (errPass) errBaru.password = errPass;

    setErrors(errBaru);
    if (Object.keys(errBaru).length > 0) return;

    setIsSubmitting(true);
    try {
      const { data: rows } = await supabase.from("users").select("*");
      const ditemukan = (rows || []).find(
        (u) =>
          u.email?.toLowerCase() === identitas ||
          u.email?.toLowerCase() === formatOtomatisGmail(identitas) ||
          u.username?.toLowerCase() === identitas ||
          u.nama?.toLowerCase() === identitas
      );

      if (!ditemukan) {
        setErrors({
          gmail:
            "Akun tidak ditemukan. Pastikan penulisan Gmail/Username benar atau Daftar Akun Baru.",
        });
        setIsSubmitting(false);
        return;
      }

      const passTersimpan =
        ditemukan.password_hash || ditemukan.profil_dna?.pin || "";
      if (passTersimpan && passTersimpan !== form.password) {
        setErrors({
          password:
            "Password yang kamu masukkan belum sesuai. Silakan cek kembali atau klik Lupa Password.",
        });
        setIsSubmitting(false);
        return;
      }

      if (onNotify) onNotify(`Selamat datang kembali, ${ditemukan.nama}!`);
      onAuthSuccess(ditemukan);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKirimPermintaanLupaPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    const emailTarget = formatOtomatisGmail(form.gmail);
    setForm((prev) => ({ ...prev, gmail: emailTarget }));

    if (!emailTarget.endsWith("@gmail.com")) {
      setErrors({
        gmail: "Masukkan alamat @gmail.com yang terdaftar pada akunmu.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: rows } = await supabase.from("users").select("id, email");
      const akunAda = (rows || []).find(
        (u) => u.email?.toLowerCase() === emailTarget
      );

      if (!akunAda) {
        setErrors({
          gmail: "Alamat Gmail ini belum terdaftar di sistem Hookya.",
        });
        setIsSubmitting(false);
        return;
      }

      const { error: resetErr } = await supabase.auth.signInWithOtp({
        email: emailTarget,
      });
      if (resetErr) {
        await supabase.auth.resetPasswordForEmail(emailTarget);
      }

      setMode("forgot_verify");
      setInfoPesanHijau(
        `Kode pemulihan keamanan telah dikirim ke ${emailTarget}. Silakan cek kotak masuk Gmail kamu.`
      );
    } catch (err) {
      setErrors({ gmail: "Gagal mengirim email pemulihan: " + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifikasiDanSimpanPasswordBaru = async (e) => {
    e.preventDefault();
    const errBaru = {};

    if (!inputKodeOTP.trim() || inputKodeOTP.trim().length < 6) {
      errBaru.otp = "Masukkan 6 angka kode pemulihan yang dikirim ke Gmail kamu.";
    }
    const errPass = cekValidasiPassword(form.password);
    if (errPass) errBaru.password = errPass;

    setErrors(errBaru);
    if (Object.keys(errBaru).length > 0) return;

    setIsSubmitting(true);
    try {
      const emailTarget = formatOtomatisGmail(form.gmail);
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: emailTarget,
        token: inputKodeOTP.trim(),
        type: "email",
      });

      if (verifyErr) {
        const { error: recErr } = await supabase.auth.verifyOtp({
          email: emailTarget,
          token: inputKodeOTP.trim(),
          type: "recovery",
        });
        if (recErr) {
          throw new Error("Kode pemulihan Gmail salah atau sudah kedaluwarsa.");
        }
      }

      await supabase.auth.updateUser({ password: form.password });
      await supabase
        .from("users")
        .update({ password_hash: form.password })
        .eq("email", emailTarget);

      if (onNotify) {
        onNotify(
          "Password baru berhasil disimpan! Silakan masuk menggunakan password barumu."
        );
      }
      setInputKodeOTP("");
      setMode("login");
    } catch (err) {
      setErrors({ otp: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              "Langkah 1 dari 3: Lengkapi identitas akun kreator barumu."}
            {mode === "register_step2_package" &&
              "Langkah 2 dari 3: Pilih paket koin aktivasi akunmu."}
            {mode === "register_step3_pay_verify" &&
              "Langkah 3 dari 3: Selesaikan pembayaran paket & konfirmasi Gmail."}
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
            MODE 1: LOGIN
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
                    setForm({ ...form, gmail: e.target.value });
                    setErrors({ ...errors, gmail: "" });
                  }}
                  onBlur={() => {
                    if (
                      form.gmail.includes("@") ||
                      form.gmail.endsWith(".com")
                    ) {
                      setForm({
                        ...form,
                        gmail: formatOtomatisGmail(form.gmail),
                      });
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
                    setErrors({});
                    setInfoPesanHijau("");
                    setMode("forgot_request");
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
                    const val = e.target.value;
                    setForm({ ...form, password: val });
                    setErrors({
                      ...errors,
                      password:
                        val.length > 0 && val.length < 8
                          ? `Baru ${val.length} karakter (Minimal wajib 8 angka/karakter)`
                          : "",
                    });
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
            MODE 2: PENDAFTARAN LANGKAH 1 (DATA DIRI)
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
                  setForm({ ...form, namaLengkap: e.target.value });
                  setErrors({ ...errors, namaLengkap: "" });
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
                    .replace(/[^a-z0-9._]/g, "");
                  setForm({ ...form, username: val });
                  setErrors({ ...errors, username: "" });
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
                    let val = e.target.value;
                    if (val.endsWith("@")) val = val + "gmail.com";
                    setForm({ ...form, gmail: val });
                    setErrors({ ...errors, gmail: "" });
                  }}
                  onBlur={() => {
                    if (form.gmail.trim()) {
                      setForm((prev) => ({
                        ...prev,
                        gmail: formatOtomatisGmail(prev.gmail),
                      }));
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
                  let val = e.target.value;
                  if (val.endsWith("@")) val = val + "gmail.com";
                  setForm({ ...form, konfirmasiGmail: val });
                  setErrors({ ...errors, konfirmasiGmail: "" });
                }}
                onBlur={() => {
                  if (form.konfirmasiGmail.trim()) {
                    const formatted = formatOtomatisGmail(form.konfirmasiGmail);
                    setForm((prev) => ({
                      ...prev,
                      konfirmasiGmail: formatted,
                    }));
                    if (formatted !== formatOtomatisGmail(form.gmail)) {
                      setErrors((prev) => ({
                        ...prev,
                        konfirmasiGmail:
                          "Alamat konfirmasi Gmail belum sama dengan Gmail di atas.",
                      }));
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
                  const val = e.target.value;
                  setForm({ ...form, whatsapp: val });
                  const pesan = val ? cekValidasiWhatsApp(val) : "";
                  setErrors({ ...errors, whatsapp: pesan });
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
                    const val = e.target.value;
                    setForm({ ...form, password: val });
                    setErrors({
                      ...errors,
                      password: val ? cekValidasiPassword(val) : "",
                    });
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
                : "Lanjut ke Langkah 2: Pilih Paket Aktivasi ➔"}
            </button>
          </form>
        )}

        {/* =================================================================
            MODE 3: PENDAFTARAN LANGKAH 2 (PILIH PAKET KOIN / VOUCHER / TESTER)
        ================================================================= */}
        {mode === "register_step2_package" && (
          <div className="space-y-4">
            {/* Sakelar 3 Jalur Aktivasi */}
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

            {/* OPSI A: PILIH PAKET BERBAYAR (MULAI Rp5.000) */}
            {tipeAktivasi === "berbayar" && (
              <div className="space-y-2.5">
                {PILIHAN_PAKET_PENDAFTARAN.map((p) => {
                  const sedangDipilih = paketTerpilih.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaketTerpilih(p)}
                      className={`cursor-pointer w-full p-4 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                        sedangDipilih
                          ? "bg-[#d4f34a] text-[#14141f] border-[#14141f] shadow-xs"
                          : "bg-[#fafafa] text-[#14141f] border-slate-200 hover:border-slate-400"
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
                        <span className="text-[10px] font-bold underline">
                          {sedangDipilih ? "✓ Dipilih" : "Pilih"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* OPSI B: PAKAI KODE VOUCHER */}
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
                <p className="text-[11px] text-slate-500 text-center">
                  Koin akan otomatis ditambahkan ke akunmu sesuai nominal voucher.
                </p>
              </div>
            )}

            {/* OPSI C: AKUN TESTER TERBATAS (2 KOIN = 1x TES SKRIP) */}
            {tipeAktivasi === "tester" && (
              <div className="bg-[#f4f5f7] p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-[#14141f]">
                  Mode Tester (Kuota Terbatas 2 Koin)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Kamu akan mendapatkan <strong>2 Koin</strong> untuk mencoba membuat skrip pertama di dalam aplikasi. Untuk membuka akses produksi skrip penuh dan ekstraksi video, kamu dapat membeli paket mulai Rp5.000 kapan saja di menu Paket Koin.
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
                onClick={handleProsesPaketDanKirimGmail}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
              >
                {isSubmitting
                  ? "Memproses..."
                  : tipeAktivasi === "berbayar"
                  ? `Beli ${paketTerpilih.nama} (${paketTerpilih.hargaTeks}) & Konfirmasi Gmail ➔`
                  : "Lanjut Konfirmasi Gmail ➔"}
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            MODE 4: PENDAFTARAN LANGKAH 3 (PEMBAYARAN PAKET + KONFIRMASI GMAIL)
        ================================================================= */}
        {mode === "register_step3_pay_verify" && (
          <form
            onSubmit={handleVerifikasiAkhirPendaftaran}
            className="space-y-4"
          >
            {/* Kotak Tagihan Jika Memilih Paket Berbayar */}
            {tipeAktivasi === "berbayar" && invoiceReg && (
              <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 text-center space-y-2.5">
                <span className="text-[11px] font-bold bg-[#14141f] text-[#d4f34a] px-2.5 py-0.5 rounded-md">
                  Tagihan Pendaftaran #{invoiceReg.invoiceId}
                </span>
                <div className="text-xs font-bold text-[#14141f]">
                  {invoiceReg.namaPaket} (+{invoiceReg.koin} Koin)
                </div>

                <div className="w-32 h-32 mx-auto bg-white rounded-2xl border border-slate-300 flex flex-col items-center justify-center p-2">
                  <FlatIcon name="qr" className="w-20 h-20 text-[#14141f]" />
                  <span className="text-[9px] font-bold text-slate-500">
                    QRIS / MIDTRANS
                  </span>
                </div>

                <div className="text-lg font-bold text-[#14141f]">
                  Rp{invoiceReg.nominalUnik.toLocaleString("id-ID")}
                </div>

                {invoiceReg.midtransUrl && (
                  <a
                    href={invoiceReg.midtransUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block bg-[#d4f34a] text-[#14141f] text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Buka Halaman Pembayaran Midtrans ↗
                  </a>
                )}

                <label className="cursor-pointer flex items-center justify-center gap-2 pt-1 text-xs font-bold text-[#14141f]">
                  <input
                    type="checkbox"
                    checked={sudahKlikBayar}
                    onChange={(e) => setSudahKlikBayar(e.target.checked)}
                    className="w-4 h-4 accent-[#14141f]"
                  />
                  <span>Saya sudah melakukan pembayaran paket ini</span>
                </label>
              </div>
            )}

            {/* Kotak Verifikasi Gmail */}
            <div className="bg-[#f4f5f7] p-4 rounded-2xl text-xs space-y-2 border border-slate-200">
              <div className="font-bold text-[#14141f]">
                Konfirmasi Alamat Gmail: {form.gmail}
              </div>
              <p className="text-slate-600 leading-relaxed">
                Buka kotak masuk Gmail kamu dan klik tautan konfirmasi yang baru kami kirimkan (atau masukkan 6 angka kode OTP di bawah jika ada).
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={inputKodeOTP}
                onChange={(e) => {
                  setInputKodeOTP(e.target.value);
                  setErrors({});
                }}
                placeholder="Kode OTP 6 Angka (Opsional jika sudah klik link di Gmail)"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-center text-xs font-bold tracking-widest outline-none"
              />
            </div>

            {errors.otp && (
              <p className="text-[11px] font-bold text-rose-600">
                ⚠️ {errors.otp}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              {isSubmitting
                ? "Mengaktifkan Akun & Koin..."
                : "Selesaikan Konfirmasi & Masuk ke Hookya ➔"}
            </button>

            <button
              type="button"
              onClick={() => setMode("register_step2_package")}
              className="cursor-pointer w-full text-xs font-bold text-slate-500 py-1"
            >
              ← Kembali Ganti Pilihan Paket
            </button>
          </form>
        )}

        {/* =================================================================
            MODE 5 & 6: LUPA PASSWORD VIA GMAIL
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
                  setForm({ ...form, gmail: e.target.value });
                  setErrors({});
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
                  setInputKodeOTP(e.target.value);
                  setErrors({ ...errors, otp: "" });
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
                    const val = e.target.value;
                    setForm({ ...form, password: val });
                    setErrors({
                      ...errors,
                      password: val ? cekValidasiPassword(val) : "",
                    });
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
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-4 mt-3 text-center text-xs">
        {mode === "login" ? (
          <span>
            Belum punya akun Hookya?{" "}
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setInfoPesanHijau("");
                setMode("register_step1");
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
                setErrors({});
                setInfoPesanHijau("");
                setMode("login");
              }}
              className="cursor-pointer font-bold text-[#14141f] underline ml-1"
            >
              Masuk di Sini
            </button>
          </span>
        )}
      </div>
    </div>
  );
}