
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StudentTests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [completedTests, setCompletedTests] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCompletedTests();
    }
  }, [user]);

  const fetchCompletedTests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log("Fetching completed tests for user:", user.id);
      
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select(`
          id,
          score,
          completed_at,
          started_at,
          quiz_id,
          quizzes (
            id,
            title,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error("Error fetching submissions:", error);
        throw error;
      }

      console.log("Fetched submissions:", submissions);

      // Only include completed submissions with scores
      const completedSubmissions = submissions.filter(sub => sub.completed_at !== null);
      console.log("Filtered completed submissions:", completedSubmissions);
      
      // For each submission, get its position/rank among all submissions for that quiz
      const submissionsWithRanks = await Promise.all(completedSubmissions.map(async sub => {
        try {
          // Get all completed submissions for this quiz with scores
          const { data: allQuizSubmissions, error: rankError } = await supabase
            .from('submissions')
            .select('score')
            .eq('quiz_id', sub.quiz_id)
            .not('completed_at', 'is', null)
            .order('score', { ascending: false });
          
          if (rankError || !allQuizSubmissions) {
            console.error("Error getting submission ranks:", rankError);
            return { ...sub, rank: 'N/A', totalSubmissions: 0 };
          }
          
          // Find position of current user's submission in the sorted array
          const position = allQuizSubmissions.findIndex(s => s.score === sub.score) + 1;
          return { 
            ...sub, 
            rank: position, 
            totalSubmissions: allQuizSubmissions.length 
          };
        } catch (err) {
          console.error("Error processing submission rank:", err);
          return { ...sub, rank: 'N/A', totalSubmissions: 0 };
        }
      }));
      
      console.log("Submissions with ranks:", submissionsWithRanks);
      setCompletedTests(submissionsWithRanks);
      setTotalPages(Math.ceil(submissionsWithRanks.length / 10) || 1);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching test history:", error);
      toast.error("Failed to load test history");
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAttendQuiz = () => {
    navigate('/student/attend');
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

  const filteredTests = completedTests.filter(test => 
    test.quizzes?.title?.toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * 10, 
    currentPage * 10
  );

  if (!user) return null;

  return (
    <DashboardLayout navItems={getNavItems("student")}>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Tests</h1>
          <p className="text-muted-foreground">
            View your completed tests and attend new ones
          </p>
        </div>

        <div className="mb-6 flex justify-end">
          <Button onClick={handleAttendQuiz}>
            Attend a New Test
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
            <CardDescription>
              Tests you've completed
            </CardDescription>

            <div className="mt-2 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search test history..."
                value={searchText}
                onChange={handleSearchChange}
                className="pl-8 max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your test history...</p>
              </div>
            ) : paginatedTests.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date Completed</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.quizzes?.title || "Unknown"}</TableCell>
                        <TableCell>{formatDate(test.completed_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`
                            ${test.score >= 80 ? "bg-green-100 text-green-800 border-green-200" : 
                              test.score >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200" : 
                              "bg-red-100 text-red-800 border-red-200"}
                          `}>
                            {test.score !== null ? `${test.score}%` : "0%"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {test.rank}/{test.totalSubmissions}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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
              </>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">No test history found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Attend a test to see your results here
                </p>
                <Button onClick={handleAttendQuiz} className="mt-4">
                  Attend a New Test
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentTests;
