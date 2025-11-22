
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import ReportForm from "@/components/ReportForm";

const TeacherReports = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout navItems={getNavItems("teacher")}>
      <div className="container py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submit Report</h1>
          <p className="text-muted-foreground">
            Report issues or provide feedback to administrators
          </p>
        </div>
        
        <div className="max-w-xl">
          <ReportForm />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherReports;
