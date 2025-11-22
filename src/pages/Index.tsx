
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Index = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    console.log("Index page: Loading auth state...");
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  console.log("Index page: Auth state loaded, user:", user);
  
  if (!user) {
    console.log("Index page: No user, redirecting to auth page");
    return <Navigate to="/" />;
  }
  
  // Redirect based on user role
  if (user.role === "student") {
    console.log("Index page: Redirecting student to dashboard");
    return <Navigate to="/student/dashboard" />;
  } else if (user.role === "teacher") {
    console.log("Index page: Redirecting teacher to dashboard");
    return <Navigate to="/teacher/dashboard" />;
  } else if (user.role === "admin") {
    console.log("Index page: Redirecting admin to dashboard");
    return <Navigate to="/admin/dashboard" />;
  }
  
  // Default fallback
  console.log("Index page: No role match, redirecting to auth page");
  return <Navigate to="/" />;
};

export default Index;
