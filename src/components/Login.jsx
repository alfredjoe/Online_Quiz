import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bgImage from "../images/bg.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("none");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    if (!email || password.length < 8 || role === "none") {
      setMessage("Invalid credentials");
      setMessageType("error");
      setShowMessage(true);
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("Login failed:", data.error);
        setMessage(data.error || "Invalid email or password.");
        setMessageType("error");
      } else {
        console.log("Login successful:", data);
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        setMessage("Login Successful 🎉");
        setMessageType("success");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (error) {
      console.error("Server error:", error);
      setMessage("Server error. Try again later.");
      setMessageType("error");
    }
  
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };
  

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-gray-100 p-6 md:p-12">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="none">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-500 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {showMessage && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 text-white rounded shadow-lg ${
            messageType === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default Login;
