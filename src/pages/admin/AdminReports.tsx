
import React, { useState, useEffect } from "react";
import { FileText, Search } from "lucide-react";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Report } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reportsPerPage] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [responseStatus, setResponseStatus] = useState<"addressed" | "rejected">("addressed");

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, currentPage, searchText]);

  const fetchReports = async () => {
    try {
      const startIndex = (currentPage - 1) * reportsPerPage;
      
      let query = supabase
        .from('reports')
        .select('*', { count: 'exact' });
      
      if (searchText) {
        query = query.or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%,category.ilike.%${searchText}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + reportsPerPage - 1);
      
      if (error) throw error;
      
      if (count !== null) {
        setTotalPages(Math.ceil(count / reportsPerPage));
      }
      
      setReports(data || []);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    }
  };

  const handleRespond = async () => {
    if (!selectedReport) return;
    
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('reports')
        .update({
          status: responseStatus,
          admin_response: responseText,
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id);
      
      if (error) throw error;
      
      toast.success("Response submitted successfully");
      setDialogOpen(false);
      setResponseText("");
      fetchReports();
    } catch (error: any) {
      console.error("Error responding to report:", error);
      toast.error(error.message || "Failed to submit response");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
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

  if (!user) return null;

  return (
    <DashboardLayout navItems={getNavItems("admin")}>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Reports Management</h1>
          <p className="text-muted-foreground">
            View and respond to reports submitted by students and teachers
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              All Reports
            </CardTitle>
            <CardDescription>
              Manage reports from students and teachers
            </CardDescription>
            <div className="mt-2">
              <div className="relative max-w-sm">
                <Input
                  placeholder="Search reports by title, category, or content..."
                  value={searchText}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No reports found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{report.category}</TableCell>
                        <TableCell>{report.reporter_role}</TableCell>
                        <TableCell>{formatDate(report.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={report.status !== 'pending'}
                            onClick={() => {
                              setSelectedReport(report);
                              setDialogOpen(true);
                            }}
                          >
                            Respond
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(currentPage - 1)} 
                            />
                          </PaginationItem>
                        )}
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === currentPage}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => handlePageChange(currentPage + 1)} 
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Response Dialog */}
      {selectedReport && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Respond to Report</DialogTitle>
              <DialogDescription>
                Provide a response to {selectedReport.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Report Information</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm mb-1"><span className="font-medium">Title:</span> {selectedReport.title}</p>
                  <p className="text-sm mb-1"><span className="font-medium">Category:</span> {selectedReport.category}</p>
                  <p className="text-sm mb-1"><span className="font-medium">Submitted:</span> {formatDate(selectedReport.created_at)}</p>
                  <p className="text-sm mt-2">{selectedReport.description}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Your Response</h3>
                <Textarea
                  placeholder="Write your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Status</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={responseStatus === 'addressed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setResponseStatus('addressed')}
                    className={responseStatus === 'addressed' ? '' : 'text-green-600'}
                  >
                    Mark as Addressed
                  </Button>
                  <Button 
                    variant={responseStatus === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setResponseStatus('rejected')}
                    className={responseStatus === 'rejected' ? '' : 'text-red-600'}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex space-x-2 sm:space-x-0">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleRespond} 
                disabled={isProcessing || !responseText.trim()}
              >
                Submit Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default AdminReports;
