
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const AuthPage = () => {
  const { user, login, register, isLoading, error } = useAuth();
  const [authType, setAuthType] = useState<"login" | "register">("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<"student" | "teacher">("student");
  
  // Auth error message
  const [formError, setFormError] = useState<string | null>(null);
  
  // Clear form errors when switching tabs
  useEffect(() => {
    setFormError(null);
  }, [authType]);
  
  // Update form error when auth error changes
  useEffect(() => {
    setFormError(error);
  }, [error]);

  if (user) {
    // Redirect based on role
    if (user.role === "admin") {
      return <Navigate to="/admin/AdminDashboard" />;
    } else if (user.role === "teacher") {
      return <Navigate to="/teacher/dashboard" />;
    } else {
      return <Navigate to="/student/dashboard" />;
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      console.log("Login attempt with:", loginEmail);
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      console.error("Login error in handler:", err);
      setFormError(err.message || "Login failed");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (registerPassword !== registerConfirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    
    try {
      console.log("Register attempt with:", registerEmail);
      await register(registerName, registerEmail, registerPassword, registerRole);
    } catch (err: any) {
      console.error("Register error in handler:", err);
      setFormError(err.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">QuizVerse</h1>
          <p className="mt-2 text-muted-foreground">Your interactive quiz platform</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <Tabs defaultValue="login" className="w-full" value={authType} onValueChange={(value) => setAuthType(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {authType === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            )}
            
            {authType === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Password</Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Register As</Label>
                  <RadioGroup 
                    value={registerRole} 
                    onValueChange={(value) => setRegisterRole(value as "student" | "teacher")}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="reg-student" />
                      <Label htmlFor="reg-student">Student</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="teacher" id="reg-teacher" />
                      <Label htmlFor="reg-teacher">Teacher</Label>
                    </div>
                  </RadioGroup>
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Register"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
