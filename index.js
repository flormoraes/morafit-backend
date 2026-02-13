import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";
import axios from "axios";
import { updateOrderStatus } from "./firebaseAdmin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;


app.use(
  cors({
    origin: [
      "https://www.morafit.uy",
      "https://morafit.uy",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 MUY IMPORTANTE
app.options("*", cors());

app.use(express.json());

// ✅ Nueva forma correcta
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

app.post("/checkout", async (req, res) => {
  try {
    const { items, metadata } = req.body;

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items,

        back_urls: {
          success: "https://www.morafit.uy/ordenes/gracias",
          failure: "https://www.morafit.uy/ordenes/error",
          pending: "https://www.morafit.uy/ordenes/pendiente",
        },


        metadata, // 👈 idorden real de Firebase

        notification_url: "https://morafit-backend-7e4db95f522c.herokuapp.com/webhook",
      },
    });

    res.send(response.init_point);
  } catch (error) {
    console.error("❌ Mercado Pago error:", error);
    res.status(500).json({ error: "Error Mercado Pago" });
  }
});

app.post("/ordencreada", (req, res) => {
  try {
    console.log("📦 Orden recibida:", req.body);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando orden" });
  }
});

// 👇 webhook de Mercado Pago
app.post("/webhook", async (req, res) => {
  console.log("🔔 WEBHOOK RECIBIDO", req.body);
  try {
    const paymentId = req.body?.data?.id;

    if (!paymentId) {
      return res.sendStatus(200);
    }

    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = response.data;
    const idorden = payment.metadata?.idorden;

    if (payment.status === "approved" && idorden) {
      await updateOrderStatus(idorden, "Pagado");
      console.log("✅ Orden marcada como Pagado:", idorden);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error webhook:", error);
    res.sendStatus(500);
  }
});


app.listen(PORT, () => {
  console.log("✅ Backend corriendo en puerto", PORT);
});

