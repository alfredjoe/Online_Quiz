import React, { useState, useEffect } from "react";
import { Search, Settings, Trash, CheckCircle, XCircle, Edit, Eye, Loader2 } from "lucide-react";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SubmissionsList from "@/components/SubmissionsList";

const AdminTests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "toggle">("delete");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTests();
    }
  }, [user, activeTab]);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('quizzes')
        .select('*');

      if (activeTab === "active") {
        query = query.eq('is_active', true);
      } else if (activeTab === "inactive") {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching tests:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const testsWithCreators = await Promise.all(
          data.map(async (test) => {
            try {
              const { data: creatorData, error: creatorError } = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', test.created_by)
                .single();
              
              if (creatorError) {
                console.error("Error fetching creator info:", creatorError);
                return {
                  ...test,
                  creator: { name: "Unknown", email: "unknown" },
                  submissionCount: 0
                };
              }

              const { count, error: submissionError } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('quiz_id', test.id);
              
              return {
                ...test,
                creator: creatorData || { name: "Unknown", email: "unknown" },
                submissionCount: submissionError ? 0 : count || 0
              };
            } catch (err) {
              console.error("Error processing test:", err);
              return {
                ...test,
                creator: { name: "Unknown", email: "unknown" },
                submissionCount: 0
              };
            }
          })
        );
      
        setTests(testsWithCreators);
        setTotalPages(Math.ceil(testsWithCreators.length / 10) || 1);
      } else {
        setTests([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Failed to load tests");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTestSubmissions = async (testId: string) => {
    try {
      setIsLoadingSubmissions(true);
      setSelectedTest(tests.find(test => test.id === testId));
      
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          score,
          completed_at,
          started_at,
          user_id
        `)
        .eq('quiz_id', testId)
        .order('completed_at', { ascending: false });
      
      if (submissionsError) {
        console.error("Error fetching test submissions:", submissionsError);
        throw submissionsError;
      }
      
      if (!submissionsData || submissionsData.length === 0) {
        setSubmissions([]);
        setShowSubmissions(true);
        setIsLoadingSubmissions(false);
        return;
      }
      
      const completedSubmissions = submissionsData.filter(submission => submission.completed_at !== null);
      
      if (completedSubmissions.length === 0) {
        setSubmissions([]);
        setShowSubmissions(true);
        setIsLoadingSubmissions(false);
        return;
      }
      
      const userIds = Array.from(new Set(completedSubmissions.map(sub => sub.user_id)));
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }
      
      const processedSubmissions = completedSubmissions.map(submission => {
        const profile = profilesData?.find(p => p.id === submission.user_id);
        
        return {
          ...submission,
          profiles: profile || { name: "Unknown", email: "No email" }
        };
      });
      
      console.log("Fetched submissions for admin view:", processedSubmissions);
      
      setSubmissions(processedSubmissions);
      setShowSubmissions(true);
      setIsLoadingSubmissions(false);
    } catch (error) {
      console.error("Error fetching test submissions:", error);
      toast.error("Failed to load submissions");
      setIsLoadingSubmissions(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleToggleActive = (test: any) => {
    setSelectedTest(test);
    setActionType("toggle");
    setConfirmDialogOpen(true);
  };

  const handleDelete = (test: any) => {
    setSelectedTest(test);
    setActionType("delete");
    setConfirmDialogOpen(true);
  };

  const handleEdit = (test: any) => {
    navigate(`/teacher/edit/${test.id}`);
  };

  const confirmAction = async () => {
    if (!selectedTest) return;
    
    setIsProcessing(true);
    
    try {
      if (actionType === "delete") {
        const { error } = await supabase
          .from('quizzes')
          .delete()
          .eq('id', selectedTest.id);
        
        if (error) throw error;
        
        setTests(tests.filter(t => t.id !== selectedTest.id));
        toast.success("Test deleted successfully");
      } else {
        const { error } = await supabase
          .from('quizzes')
          .update({ is_active: !selectedTest.is_active })
          .eq('id', selectedTest.id);
        
        if (error) throw error;
        
        setTests(tests.map(t => 
          t.id === selectedTest.id ? { ...t, is_active: !t.is_active } : t
        ));
        
        toast.success(`Test ${selectedTest.is_active ? "deactivated" : "activated"} successfully`);
      }
    } catch (error: any) {
      console.error("Error performing action:", error);
      toast.error(error.message || "Failed to perform action");
    } finally {
      setIsProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredTests = tests.filter(test => 
    test.title?.toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * 10, 
    currentPage * 10
  );

  if (!user) return null;

  return (
    <DashboardLayout navItems={getNavItems("admin")}>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tests Management</h1>
          <p className="text-muted-foreground">
            View and manage all tests in the system
          </p>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Tests</CardTitle>
            <CardDescription>
              View, activate, deactivate, or delete tests
            </CardDescription>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests by title..."
                  value={searchText}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger 
                    value="all" 
                    onClick={() => {
                      setActiveTab("all");
                      setCurrentPage(1);
                    }}
                    className={activeTab === "all" ? "bg-primary text-primary-foreground" : ""}
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="active" 
                    onClick={() => {
                      setActiveTab("active");
                      setCurrentPage(1);
                    }}
                    className={activeTab === "active" ? "bg-primary text-primary-foreground" : ""}
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger 
                    value="inactive" 
                    onClick={() => {
                      setActiveTab("inactive");
                      setCurrentPage(1);
                    }}
                    className={activeTab === "inactive" ? "bg-primary text-primary-foreground" : ""}
                  >
                    Inactive
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading tests...</p>
              </div>
            ) : paginatedTests.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Created By</TableHead>
                      <TableHead className="hidden md:table-cell">Submissions</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {test.creator?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{test.submissionCount || 0}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge className={test.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"} variant="outline">
                            {test.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(test.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(test)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => fetchTestSubmissions(test.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleToggleActive(test)}
                            >
                              {test.is_active ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleDelete(test)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                          let pageNumber = currentPage;
                          if (totalPages <= 5) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                          } else {
                            pageNumber = currentPage - 2 + index;
                          }
                          
                          return (
                            <PaginationItem key={index}>
                              <PaginationLink 
                                onClick={() => handlePageChange(pageNumber)}
                                isActive={currentPage === pageNumber}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 border rounded-md">
                <p className="text-muted-foreground">No tests found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "delete" 
                ? "Delete Test" 
                : (selectedTest?.is_active ? "Deactivate Test" : "Activate Test")}
            </DialogTitle>
            <DialogDescription>
              {actionType === "delete"
                ? "Are you sure you want to delete this test? This action cannot be undone."
                : (selectedTest?.is_active 
                    ? "Are you sure you want to deactivate this test? Students will not be able to take it."
                    : "Are you sure you want to activate this test? Students will be able to take it.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "delete" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmissions} onOpenChange={setShowSubmissions}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quiz Submissions</DialogTitle>
            <DialogDescription>
              {selectedTest ? selectedTest.title : "Test"} - Submissions
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SubmissionsList 
              submissions={submissions} 
              isLoading={isLoadingSubmissions} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTests;
