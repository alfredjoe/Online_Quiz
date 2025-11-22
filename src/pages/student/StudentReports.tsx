
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import ReportForm from "@/components/ReportForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Report } from "@/types/supabase";

const StudentReports = () => {
  const { user } = useAuth();
  const [userReports, setUserReports] = useState<Report[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserReports();
    }
  }, [user]);

  const fetchUserReports = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserReports(data || []);
    } catch (error: any) {
      console.error("Error fetching user reports:", error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "addressed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Addressed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <DashboardLayout navItems={getNavItems("student")}>
      <div className="container py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
          <p className="text-muted-foreground">
            View your submitted reports and their status
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Reports</CardTitle>
                <CardDescription>
                  Track the status of your submitted reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userReports.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">You haven't submitted any reports yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userReports.map((report) => (
                        <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                          const details = document.getElementById(`details-${report.id}`);
                          if (details) {
                            const isVisible = details.classList.contains('visible');
                            details.classList.toggle('hidden', isVisible);
                            details.classList.toggle('visible', !isVisible);
                          }
                        }}>
                          <TableCell className="font-medium">{report.title}</TableCell>
                          <TableCell>{report.category}</TableCell>
                          <TableCell>{formatDate(report.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <ReportForm />
          </div>
        </div>
        
        {/* Report Details */}
        {userReports.map((report) => (
          <div key={`details-${report.id}`} id={`details-${report.id}`} className="hidden">
            <Card>
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>
                  Submitted on {formatDate(report.created_at)} • Category: {report.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Your Description:</h3>
                  <p className="mt-2">{report.description}</p>
                </div>
                
                {report.admin_response && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold">Response:</h3>
                    <p className="mt-2">{report.admin_response}</p>
                    {report.responded_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Responded on {formatDate(report.responded_at)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentReports;
