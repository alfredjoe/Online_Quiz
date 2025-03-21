const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(bodyParser.json());

// Simulated database (Replace with Firestore)
const users = [
  { email: "student@example.com", password: "student123", role: "student" },
  { email: "teacher@example.com", password: "teacher123", role: "teacher" },
];

// Signup route
app.post("/signup", (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (users.some((u) => u.email === email)) {
      return res.status(400).json({ error: "Email already registered" });
    }

    users.push({ email, password, role });
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login route
app.post("/login", (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = users.find(
      (u) => u.email === email && u.password === password && u.role === role
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ token: "fake-jwt-token", role: user.role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
