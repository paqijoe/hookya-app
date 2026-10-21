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
    const contentType = request.headers.get("content-type") || ""
    let body = {}

    // Duitku mengirimkan callback/webhook bisa dalam format x-www-form-urlencoded atau JSON
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData()
      formData.forEach((value, key) => {
        body[key] = value
      })
    } else {
      body = await request.json()
    }

    const supabase = getSupabaseClient()

    // =========================================================================
    // A. JALUR WEBHOOK / CALLBACK OTOMATIS DARI SERVER DUITKU
    // =========================================================================
    if (body.merchantOrderId && body.resultCode) {
      const merchantCode =
        process.env.DUITKU_MERCHANT_CODE || body.merchantCode || ""
      const apiKey = process.env.DUITKU_API_KEY || ""
      const { merchantOrderId, amount, resultCode, signature, paymentCode } =
        body

      // 1. Verifikasi Keamanan Signature MD5 Duitku: MD5(merchantCode + amount + merchantOrderId + apiKey)
      if (merchantCode && apiKey && signature) {
        const calcSignature = crypto
          .createHash("md5")
          .update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`)
          .digest("hex")

        if (signature.toLowerCase() !== calcSignature.toLowerCase()) {
          return NextResponse.json(
            { error: "Signature Duitku tidak valid" },
            { status: 403 },
          )
        }
      }

      // 2. resultCode "00" artinya pembayaran Sukses/Lunas di Duitku
      if (supabase && resultCode === "00") {
        const { data: trx } = await supabase
          .from("transactions")
          .select("*")
          .eq("invoice_id", merchantOrderId)
          .single()

        if (trx && trx.status !== "lunas") {
          await supabase
            .from("transactions")
            .update({
              status: "lunas",
              metode_bayar: paymentCode
                ? `Duitku (${paymentCode})`
                : "Duitku Otomatis",
            })
            .eq("id", trx.id)

          if (trx.user_id) {
            const { data: userRow } = await supabase
              .from("users")
              .select("koin")
              .eq("id", trx.user_id)
              .single()

            const koinBaru =
              (userRow?.koin || 0) + (parseInt(trx.jumlah_koin) || 0)

            await supabase
              .from("users")
              .update({ koin: koinBaru })
              .eq("id", trx.user_id)
          }
        }
      } else if (supabase && resultCode !== "00") {
        await supabase
          .from("transactions")
          .update({ status: "batal" })
          .eq("invoice_id", merchantOrderId)
      }

      return NextResponse.json({ status: "duitku_callback_ok" })
    }

    // =========================================================================
    // B. JALUR PEMBUATAN TAGIHAN BARU KE DUITKU (SAAT USER KLIK BELI PAKET)
    // =========================================================================
    const {
      action,
      invoiceId,
      userId,
      namaUser,
      emailUser,
      namaPaket,
      jumlahKoin,
      nominal,
      duitkuConfigClient,
    } = body

    if (action === "create_gateway_invoice") {
      const merchantCode =
        process.env.DUITKU_MERCHANT_CODE ||
        duitkuConfigClient?.merchantCode ||
        ""
      const apiKey =
        process.env.DUITKU_API_KEY || duitkuConfigClient?.apiKey || ""
      const isProduction =
        process.env.DUITKU_IS_PRODUCTION === "true" ||
        duitkuConfigClient?.isProduction === true

      if (merchantCode && apiKey) {
        const endpointDuitku = isProduction
          ? "https://passport.duitku.com/webapi/api/merchant/v2/inquiry"
          : "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry"

        const paymentAmount = parseInt(nominal) || 10000
        // Rumus Signature Inquiry Duitku: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
        const signature = crypto
          .createHash("md5")
          .update(`${merchantCode}${invoiceId}${paymentAmount}${apiKey}`)
          .digest("hex")

        const originUrl = request.headers.get("origin") || "https://hookya.site"

        const payloadDuitku = {
          merchantCode,
          paymentAmount,
          merchantOrderId: invoiceId,
          productDetails: `${namaPaket} (${jumlahKoin || ""} Koin Hookya)`,
          email: emailUser || "user@hookya.site",
          customerVaName: namaUser || "Kreator Hookya",
          callbackUrl: `${originUrl}/api/payment`,
          returnUrl: originUrl,
          signature,
          expiryPeriod: 60,
        }

        const response = await fetch(endpointDuitku, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadDuitku),
        })

        const data = await response.json()
        if (response.ok && data.paymentUrl) {
          if (supabase) {
            await supabase.from("transactions").insert([
              {
                invoice_id: invoiceId,
                user_id: userId || null,
                nama_user: namaUser || "Kreator",
                nama_paket: namaPaket,
                jumlah_koin: jumlahKoin || 100,
                nominal_asli: paymentAmount,
                nominal_bayar: paymentAmount,
                metode_bayar: "Duitku Payment Gateway",
                status: "pending",
              },
            ])
          }

          return NextResponse.json({
            mode: "duitku",
            redirectUrl: data.paymentUrl,
            reference: data.reference,
          })
        }
      }

      // Fallback ke QRIS Internal jika kunci Duitku belum diisi
      return NextResponse.json({
        mode: "internal_qris",
        invoiceId,
        status: "ready",
      })
    }

    return NextResponse.json({ status: "ok" })
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal memproses pembayaran Duitku" },
      { status: 500 },
    )
  }
}
