import { useState } from "react";
import { Link } from "react-router-dom";
import bgImage from "../images/bg.jpg";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("none");
  const [errors, setErrors] = useState({});
  const [showMessage, setShowMessage] = useState("");

  const validateForm = () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email address";
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (role === "none") newErrors.role = "Please select a role";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = () => {
    if (validateForm()) {
      setShowMessage("Signup Successful!");
      setTimeout(() => setShowMessage(""), 3000);
    } else {
      setShowMessage("Please fix the errors!");
      setTimeout(() => setShowMessage(""), 3000);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Left side (Image Background) */}
      <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}></div>

      {/* Right side (Signup Form) */}
      <div className="w-1/2 flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-semibold mb-4 text-center">Sign Up</h2>

          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-2 border rounded ${errors.name ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your name"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-2 border rounded ${errors.email ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your email"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-2 border rounded ${errors.password ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter your password"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full p-2 border rounded ${errors.role ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="none">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
          </div>

          {/* Signup Button */}
          <button onClick={handleSignup} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Sign Up
          </button>

          {/* Already have an account */}
          <p className="text-sm text-gray-600 mt-4 text-center">
            Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
          </p>

          {/* Popup Notification */}
          {showMessage && (
            <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-md 
                ${showMessage === "Signup Successful!" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {showMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
