import { useState } from "react";
import { Link } from "react-router-dom";
import bgImage from "../images/bg.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("none");
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [isValidRole, setIsValidRole] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = () => {
    const validEmail = validateEmail(email);
    const validPassword = password.length >= 8;
    const validRole = role !== "none";

    setIsValidEmail(validEmail);
    setIsValidPassword(validPassword);
    setIsValidRole(validRole);

    if (!validEmail || !validPassword || !validRole) {
      setMessage("Wrong Credentials");
      setMessageType("error");
    } else {
      setMessage("Login Successful");
      setMessageType("success");
    }
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}></div>
      <div className="w-1/2 flex flex-col justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-2 border rounded focus:outline-none ${isValidEmail ? "border-gray-300" : "border-red-500"}`}
              placeholder="Enter your email"
            />
            {!isValidEmail && <p className="text-red-500 text-sm mt-1">Enter a valid email address</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-2 border rounded focus:outline-none ${isValidPassword ? "border-gray-300" : "border-red-500"}`}
              placeholder="Enter your password"
            />
            {!isValidPassword && <p className="text-red-500 text-sm mt-1">Password must be at least 8 characters</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full p-2 border rounded focus:outline-none ${isValidRole ? "border-gray-300" : "border-red-500"}`}
            >
              <option value="none">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            {!isValidRole && <p className="text-red-500 text-sm mt-1">Please select a valid role</p>}
          </div>
          <button onClick={handleLogin} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Login
          </button>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
      {showMessage && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 text-white rounded shadow-lg ${messageType === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Login;
