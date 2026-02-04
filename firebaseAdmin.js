import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = admin.firestore();

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


