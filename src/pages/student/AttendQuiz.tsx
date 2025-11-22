
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const AttendQuiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizCode, setQuizCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validQuizData, setValidQuizData] = useState(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quizCode.trim()) {
      setError("Please enter a quiz code");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Check if quiz exists and is active
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, is_active, code')
        .eq('code', quizCode.trim())
        .maybeSingle();
      
      if (quizError) {
        console.error("Error checking quiz:", quizError);
        throw new Error("Failed to check quiz code");
      }
      
      if (!quiz) {
        setError("Quiz not found. Please check the code and try again.");
        setIsLoading(false);
        return;
      }
      
      if (!quiz.is_active) {
        setError("This quiz is not currently active.");
        setIsLoading(false);
        return;
      }
      
      // Check if user has already completed this quiz
      if (user) {
        const { data: submission, error: submissionError } = await supabase
          .from('submissions')
          .select('completed_at')
          .eq('quiz_id', quiz.id)
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .maybeSingle();
        
        if (submissionError) {
          console.error("Error checking submission:", submissionError);
        } else if (submission) {
          setError("You have already completed this quiz and cannot take it again.");
          setIsLoading(false);
          return;
        }
      }
      
      // Show confirmation dialog
      setValidQuizData(quiz);
      setShowConfirmDialog(true);
    } catch (error) {
      console.error("Error attending quiz:", error);
      setError("An error occurred. Please try again.");
      toast.error("Error checking quiz code");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartQuiz = () => {
    navigate(`/student/take-quiz/${quizCode}`);
  };
  
  if (!user) return null;
  
  return (
    <DashboardLayout navItems={getNavItems("student")}>
      <div className="container max-w-md py-12">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Attend a Quiz</CardTitle>
            <CardDescription>
              Enter the quiz code provided by your teacher
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-destructive/50 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Input
                  className="text-center text-2xl tracking-wider h-16 font-mono"
                  placeholder="Enter quiz code"
                  value={quizCode}
                  onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  autoComplete="off"
                  autoFocus
                />
                
                <div className="text-center text-xs text-muted-foreground">
                  The quiz code is case-sensitive
                </div>
              </div>
              
              <Button 
                className="w-full py-6" 
                size="lg"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking...
                  </>
                ) : (
                  "Attend Quiz"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ready to start the quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to start quiz: <span className="font-medium">{validQuizData?.title}</span>
              <br /><br />
              Once you begin, the timer will start and you must complete all questions. Make sure you're ready before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartQuiz}>
              Start Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AttendQuiz;
