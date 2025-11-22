
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  BarChart, 
  Loader2, 
  PlusCircle,
  BookUser,
  FileText,
  Edit 
} from "lucide-react";
import SubmissionsList from "@/components/SubmissionsList";
import { Submission } from "@/types/supabase";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalSubmissions: 0,
    averageScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching dashboard data for user:", user?.id);
      
      // Fetch quizzes created by this teacher
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (quizzesError) {
        console.error("Error fetching quizzes:", quizzesError);
        throw quizzesError;
      }
      
      console.log("Fetched quizzes:", quizzes);
      setRecentQuizzes(quizzes || []);
      
      // Count total quizzes
      const { count: totalQuizzes, error: countError } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user?.id);
      
      if (countError) {
        console.error("Error counting quizzes:", countError);
        throw countError;
      }
      
      // If no quizzes, set empty data and stop loading
      if (!quizzes || quizzes.length === 0) {
        setStats({
          totalQuizzes: totalQuizzes || 0,
          totalSubmissions: 0,
          averageScore: 0
        });
        setIsLoading(false);
        return;
      }

      // Get quiz IDs for fetching submissions
      const quizIds = quizzes.map(q => q.id);
      console.log("Quiz IDs to fetch submissions for:", quizIds);
      
      // Fetch submissions for those quizzes
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          quiz:quizzes(title, id)
        `)
        .in('quiz_id', quizIds)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError);
        throw submissionsError;
      }
      
      console.log("Fetched submissions:", submissionsData);
      
      // After fetching submissions, fetch the user profiles separately
      const processedSubmissions: Submission[] = [];
      
      if (submissionsData && submissionsData.length > 0) {
        // Get unique user IDs from the submissions
        const userIds = [...new Set(submissionsData.map(s => s.user_id))];
        
        // Fetch profiles for these users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        }
        
        // Map profiles to submissions
        for (const submission of submissionsData) {
          const userProfile = profiles?.find(p => p.id === submission.user_id);
          
          processedSubmissions.push({
            ...submission,
            profiles: userProfile ? {
              name: userProfile.name,
              email: userProfile.email
            } : {
              name: 'Unknown',
              email: 'No email'
            }
          } as Submission);
        }
      }
      
      setRecentSubmissions(processedSubmissions);
      
      // Count total submissions
      const { count: totalSubmissions, error: subCountError } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .in('quiz_id', quizIds);
      
      if (subCountError) {
        console.error("Error counting submissions:", subCountError);
        throw subCountError;
      }
      
      // Calculate average score if there are submissions
      if (processedSubmissions && processedSubmissions.length > 0) {
        const validScores = processedSubmissions.filter(s => s.score !== null);
        const totalScore = validScores.reduce((acc, curr) => {
          return acc + (curr.score || 0);
        }, 0);
        const averageScore = validScores.length > 0 ? totalScore / validScores.length : 0;
        
        setStats({
          totalQuizzes: totalQuizzes || 0,
          totalSubmissions: totalSubmissions || 0,
          averageScore: Math.round(averageScore * 10) / 10
        });
      } else {
        setStats({
          totalQuizzes: totalQuizzes || 0,
          totalSubmissions: 0,
          averageScore: 0
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout navItems={getNavItems("teacher")}>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name || "Teacher"}!
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/teacher/create")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Quiz
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Quizzes
                  </CardTitle>
                  <BookUser className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
                  <p className="text-xs text-muted-foreground">
                    Quizzes created
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Submissions
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                  <p className="text-xs text-muted-foreground">
                    Completed submissions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Score
                  </CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageScore}%</div>
                  <p className="text-xs text-muted-foreground">
                    Average student performance
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Quizzes</CardTitle>
                  <CardDescription>
                    Your recently created quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentQuizzes.length > 0 ? (
                    <div className="space-y-4">
                      {recentQuizzes.map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium">{quiz.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Code: {quiz.code || "No code"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              quiz.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {quiz.is_active ? "Active" : "Inactive"}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher/edit/${quiz.id}`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <p className="text-muted-foreground mb-4">No quizzes found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/teacher/create")}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Your First Quiz
                      </Button>
                    </div>
                  )}
                </CardContent>
                {recentQuizzes.length > 0 && (
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/teacher/tests")}
                    >
                      View All Quizzes
                    </Button>
                  </CardFooter>
                )}
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>
                    Recent student submissions to your quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubmissionsList 
                    submissions={recentSubmissions}
                    isLoading={false}
                  />
                </CardContent>
                {recentSubmissions.length > 0 && (
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/teacher/tests")}
                    >
                      View All Tests
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
