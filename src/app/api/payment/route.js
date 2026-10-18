import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(request) {
  try {
    const body = await request.json()
    const supabase = getSupabaseClient()

    // =========================================================================
    // A. JALUR WEBHOOK OTOMATIS DARI SERVER MIDTRANS (SAAT USER SELESAI BAYAR)
    // =========================================================================
    if (body.transaction_status && body.order_id) {
      const serverKey = process.env.MIDTRANS_SERVER_KEY || ""
      const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
        transaction_status,
        fraud_status,
        payment_type,
      } = body

      // 1. Verifikasi Keamanan Signature Key Midtrans (Anti-Pemalsuan)
      if (serverKey && signature_key) {
        const rawSignature = `${order_id}${status_code}${gross_amount}${serverKey}`
        const expectedSignature = crypto
          .createHash("sha512")
          .update(rawSignature)
          .digest("hex")

        if (signature_key !== expectedSignature) {
          return NextResponse.json(
            { error: "Signature Midtrans tidak valid" },
            { status: 403 },
          )
        }
      }

      // 2. Cek apakah pembayaran sudah berhasil / lunas
      const isSuccess =
        transaction_status === "settlement" ||
        (transaction_status === "capture" && fraud_status === "accept")

      const isFailed =
        transaction_status === "cancel" ||
        transaction_status === "deny" ||
        transaction_status === "expire"

      if (supabase && isSuccess) {
        // Cari transaksi berdasarkan invoice_id (order_id)
        const { data: trx } = await supabase
          .from("transactions")
          .select("*")
          .eq("invoice_id", order_id)
          .single()

        // Jika transaksi ditemukan dan belum berstatus lunas, tambahkan koin ke user!
        if (trx && trx.status !== "lunas") {
          await supabase
            .from("transactions")
            .update({
              status: "lunas",
              metode_bayar: payment_type
                ? `Midtrans (${payment_type.toUpperCase()})`
                : trx.metode_bayar,
            })
            .eq("id", trx.id)

          if (trx.user_id) {
            const { data: userRow } = await supabase
              .from("users")
              .select("koin")
              .eq("id", trx.user_id)
              .single()

            const koinLama = userRow?.koin || 0
            const koinBaru = koinLama + (parseInt(trx.jumlah_koin) || 0)

            await supabase
              .from("users")
              .update({ koin: koinBaru })
              .eq("id", trx.user_id)
          }
        }
      } else if (supabase && isFailed) {
        await supabase
          .from("transactions")
          .update({ status: "batal" })
          .eq("invoice_id", order_id)
      }

      return NextResponse.json({ status: "webhook_processed" })
    }

    // =========================================================================
    // B. JALUR PEMBUATAN TAGIHAN DARI HALAMAN PAKET KOIN HOOKYA
    // =========================================================================
    const {
      action,
      invoiceId,
      userId,
      namaUser,
      namaPaket,
      jumlahKoin,
      nominal,
    } = body

    if (action === "create_gateway_invoice") {
      const midtransServerKey = process.env.MIDTRANS_SERVER_KEY
      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true"

      if (midtransServerKey) {
        const baseUrl = isProduction
          ? "https://app.midtrans.com/snap/v1/transactions"
          : "https://app.sandbox.midtrans.com/snap/v1/transactions"

        const authString = Buffer.from(`${midtransServerKey}:`).toString(
          "base64",
        )

        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Basic ${authString}`,
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: invoiceId,
              gross_amount: nominal,
            },
            item_details: [
              {
                id: namaPaket.toLowerCase().replace(/\s+/g, "_"),
                price: nominal,
                quantity: 1,
                name: `${namaPaket} (${jumlahKoin || ""} Koin Hookya)`,
              },
            ],
            customer_details: {
              first_name: namaUser || "Kreator Hookya",
            },
          }),
        })

        const data = await response.json()
        if (response.ok && data.redirect_url) {
          // Catat transaksi pending ke Supabase agar saat Webhook masuk langsung dikenali
          if (supabase) {
            await supabase.from("transactions").insert([
              {
                invoice_id: invoiceId,
                user_id: userId || null,
                nama_user: namaUser || "Kreator",
                nama_paket: namaPaket,
                jumlah_koin: jumlahKoin || 100,
                nominal_asli: nominal,
                nominal_bayar: nominal,
                metode_bayar: "Midtrans Gateway",
                status: "pending",
              },
            ])
          }

          return NextResponse.json({
            mode: "midtrans",
            redirectUrl: data.redirect_url,
            token: data.token,
          })
        }
      }

      // Jika belum memasang MIDTRANS_SERVER_KEY, gunakan sistem QRIS Internal Hookya
      return NextResponse.json({
        mode: "internal_qris",
        invoiceId,
        status: "ready",
      })
    }

    return NextResponse.json({ status: "ok" })
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal memproses pembayaran" },
      { status: 500 },
    )
  }
}
