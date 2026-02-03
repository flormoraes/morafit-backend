import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer la key
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8")
);

// Init Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();

// 👇 ESTA ES LA FUNCIÓN QUE FALTABA
export const updateOrderStatus = async (idorden, status) => {
  try {
    const ordersRef = db.collection("orders");
    const snapshot = await ordersRef.where("id", "==", idorden).get();

    if (snapshot.empty) {
      console.log("❌ Orden no encontrada:", idorden);
      return;
    }

    snapshot.forEach(async (doc) => {
      await doc.ref.update({ status });
      console.log("✅ Orden actualizada:", idorden, status);
    });
  } catch (error) {
    console.error("❌ Error actualizando orden:", error);
  }
};

