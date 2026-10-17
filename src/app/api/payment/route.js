import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, invoiceId, namaPaket, nominal, namaUser } = body;

    // Jika ke depannya kamu memasang MIDTRANS_SERVER_KEY di .env.local,
    // rute ini otomatis membuat link pembayaran Midtrans Snap asli.
    if (action === "create_gateway_invoice") {
      const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;
      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

      if (midtransServerKey) {
        const baseUrl = isProduction
          ? "https://app.midtrans.com/snap/v1/transactions"
          : "https://app.sandbox.midtrans.com/snap/v1/transactions";

        const authString = Buffer.from(`${midtransServerKey}:`).toString(
          "base64"
        );

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
                name: namaPaket,
              },
            ],
            customer_details: {
              first_name: namaUser || "Kreator Hookya",
            },
          }),
        });

        const data = await response.json();
        if (response.ok && data.redirect_url) {
          return NextResponse.json({
            mode: "midtrans",
            redirectUrl: data.redirect_url,
            token: data.token,
          });
        }
      }

      // Jika belum memasang Midtrans Key, gunakan sistem Checkout QRIS & Kode Unik Internal Hookya
      return NextResponse.json({
        mode: "internal_qris",
        invoiceId,
        status: "ready",
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal membuat tagihan pembayaran" },
      { status: 500 }
    );
  }
}