
import React, { useState, useEffect } from "react";
import { BookOpen, FileText, ClockIcon } from "lucide-react";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attemptedQuizzes, setAttemptedQuizzes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAttempted: 0,
    averageScore: 0,
    highestScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);
  
  const fetchStudentData = async () => {
    if (!user) return;
    
    try {
      // Fetch the student's quiz submissions
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          score,
          completed_at,
          started_at,
          quizzes (
            id,
            title
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      
      // Only show completed quizzes (with a score)
      const completedQuizzes = data.filter(quiz => quiz.score !== null);
      
      setAttemptedQuizzes(completedQuizzes);
      
      // Calculate statistics
      if (completedQuizzes.length > 0) {
        const totalAttempted = completedQuizzes.length;
        const totalScore = completedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
        const averageScore = totalScore / totalAttempted;
        const highestScore = Math.max(...completedQuizzes.map(quiz => quiz.score || 0));
        
        setStats({
          totalAttempted,
          averageScore,
          highestScore,
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching student data:", error);
      setIsLoading(false);
    }
  };
  
  if (!user) return null;

  return (
    <DashboardLayout navItems={getNavItems("student")}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Welcome back, {user.name}!</h1>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total Quizzes Attempted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-3xl font-bold">{stats.totalAttempted}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-3xl font-bold">
                  {stats.totalAttempted > 0 ? stats.averageScore.toFixed(1) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Highest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-3xl font-bold">{stats.highestScore}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Quizzes</CardTitle>
            <CardDescription>
              History of quizzes you've attempted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your quiz history...</p>
              </div>
            ) : attemptedQuizzes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz Name</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attemptedQuizzes.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>{quiz.quizzes.title}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-medium ${
                          quiz.score >= 80 
                            ? "bg-green-100 text-green-800" 
                            : quiz.score >= 60 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {quiz.score}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        {new Date(quiz.completed_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">You haven't attempted any quizzes yet.</p>
                <p className="mt-2">
                  <a href="/student/attend" className="text-primary hover:underline">
                    Go to the Attend Quiz page
                  </a>{" "}
                  to take your first quiz!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
