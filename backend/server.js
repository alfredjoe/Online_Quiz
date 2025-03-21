import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Initialize Firebase Admin SDK
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// ✅ Signup - Check Firestore before creating user
app.post("/signup", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || role === "none") {
    return res.status(400).json({ error: "Invalid input data" });
  }

  try {
    // 🔍 Check if email exists
    const userQuery = await db.collection("users").where("email", "==", email).get();

    if (!userQuery.empty) {
      return res.status(400).json({ error: "User already exists" });
    }

    // ✅ Create user in Firebase Authentication
    const user = await auth.createUser({ email, password });

    // ✅ Store user in Firestore
    await db.collection("users").doc(user.uid).set({
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "User created", uid: user.uid });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Login - Fetch from Firestore
app.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    // Check Firestore for the user
    const userDoc = await db.collection("users").where("email", "==", email).get();

    if (userDoc.empty) {
      return res.status(401).json({ error: "User not found" });
    }

    const userData = userDoc.docs[0].data();
    res.status(200).json({ message: "Login successful", role: userData.role });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
