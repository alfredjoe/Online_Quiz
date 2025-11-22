import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StrictMode } from "react";

// Pages
import AuthPage from "@/pages/AuthPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import AttendQuiz from "@/pages/student/AttendQuiz";
import TakeQuiz from "@/pages/student/TakeQuiz";
import StudentReports from "@/pages/student/StudentReports";
import StudentTests from "@/pages/student/StudentTests";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherTests from "@/pages/teacher/TeacherTests";
import TeacherReports from "@/pages/teacher/TeacherReports";
import CreateTest from "@/pages/teacher/CreateTest";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminTests from "@/pages/admin/AdminTests";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminReports from "@/pages/admin/AdminReports";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import MathScannerDemo from "./pages/MathScannerDemo";
import { MathJaxContext } from "better-react-mathjax";

const mathJaxConfig = {
  loader: { load: ["[tex]/ams"] },
  tex: {
    packages: { "[+]": ["ams"] },
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
  },
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
}) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !allowedRoles.includes(user.role as string)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AuthPage />} />
    <Route path="/index" element={<Index />} />
    
    {/* Student Routes */}
    <Route 
      path="/student/dashboard" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/attend" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <AttendQuiz />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/tests" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentTests />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/reports" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentReports />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/student/take-quiz/:quizId" 
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <TakeQuiz />
        </ProtectedRoute>
      } 
    />
    
    {/* Teacher Routes */}
    <Route 
      path="/teacher/dashboard" 
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/teacher/tests" 
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherTests />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/teacher/reports" 
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherReports />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/teacher/create" 
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <CreateTest />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/teacher/edit/:testId" 
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <CreateTest />
        </ProtectedRoute>
      } 
    />
    
    {/* Admin Routes */}
    <Route 
      path="/admin/dashboard" 
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/admin/tests" 
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminTests />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/admin/users" 
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminUsers />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/admin/reports" 
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminReports />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/admin/edit-test/:testId" 
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <CreateTest />
        </ProtectedRoute>
      } 
    />
    
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
    
    {/* Math Scanner Demo Route */}
    <Route path="/math-scanner" element={<MathScannerDemo />} />
  </Routes>
);

const App = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
        <MathJaxContext config={mathJaxConfig}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
          </MathJaxContext>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);

export default App;
