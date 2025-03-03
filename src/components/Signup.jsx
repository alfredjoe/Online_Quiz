import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bgImage from "../images/bg.jpg";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("none");
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [isValidRole, setIsValidRole] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate(); // useNavigate hook

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValidEmail(validateEmail(newEmail));
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setIsValidPassword(newPassword.length >= 8);
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    setIsValidRole(newRole !== "none");
  };

  const handleSignup = () => {
    const validEmail = validateEmail(email);
    const validPassword = password.length >= 8;
    const validRole = role !== "none";

    setIsValidEmail(validEmail);
    setIsValidPassword(validPassword);
    setIsValidRole(validRole);

    if (validEmail && validPassword && validRole) {
      setMessage("Signup Successful");
      setMessageType("success");
      navigate("/dashboard"); // Navigate to the dashboard upon successful signup
    } else {
      setMessage("Wrong Credentials");
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
          <h2 className="text-2xl font-semibold mb-4 text-center">Sign Up</h2>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={handleEmailChange}
              className={`w-full p-2 border rounded focus:outline-none ${
                isValidEmail ? "border-gray-300" : "border-red-500"
              }`}
              placeholder="Enter your email"
            />
            {!isValidEmail && (
              <p className="text-red-500 text-sm mt-1">
                Enter a valid email address
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className={`w-full p-2 border rounded focus:outline-none ${
                isValidPassword ? "border-gray-300" : "border-red-500"
              }`}
              placeholder="Enter your password"
            />
            {!isValidPassword && (
              <p className="text-red-500 text-sm mt-1">
                Password must be at least 8 characters
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1">Role</label>
            <select
              value={role}
              onChange={handleRoleChange}
              className={`w-full p-2 border rounded focus:outline-none ${
                isValidRole ? "border-gray-300" : "border-red-500"
              }`}
            >
              <option value="none">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            {!isValidRole && (
              <p className="text-red-500 text-sm mt-1">
                Please select a valid role
              </p>
            )}
          </div>
          <button
            onClick={handleSignup}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Sign Up
          </button>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
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

export default Signup;
