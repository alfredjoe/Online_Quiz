
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { MathJaxContext, MathJax } from "better-react-mathjax";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/svg"] },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
    processEscapes: true,
  },
};

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_num?: number;
}

interface Question {
  id: string;
  question_text: string;
  options: Option[];
  order_num?: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number | null;
  questions: Question[];
}

const TakeQuiz = () => {
  const { quizId: quizCode } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Prevent right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener("contextmenu", handleContextMenu);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
  
  // Check for existing submission in localStorage to prevent duplicate submissions on reload
  useEffect(() => {
    if (hasInitialized || !quizCode || !user) return;
    
    const existingSubmission = localStorage.getItem(`quiz_submission_${quizCode}`);
    if (existingSubmission) {
      try {
        const submissionData = JSON.parse(existingSubmission);
        // If we have a completed submission already stored, go to results directly
        if (submissionData.completed) {
          setShowResults(true);
          setScore(submissionData.score || 0);
          setHasInitialized(true);
          setIsLoading(false);
          return;
        }
        
        // If we have an existing submission that wasn't completed
        if (submissionData.submissionId && submissionData.timeRemaining > 0) {
          console.log("Resuming existing submission:", submissionData);
          setSubmissionId(submissionData.submissionId);
          setTimeRemaining(submissionData.timeRemaining);
          if (submissionData.selectedAnswers) {
            setSelectedAnswers(submissionData.selectedAnswers);
          }
        }
      } catch (e) {
        console.error("Error parsing stored submission data:", e);
        localStorage.removeItem(`quiz_submission_${quizCode}`);
      }
    }
    
    const loadQuiz = async () => {
      try {
        setIsLoading(true);
        console.log("Loading quiz with code:", quizCode);
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            id, 
            title, 
            description, 
            time_limit,
            is_active,
            code
          `)
          .eq('code', quizCode)
          .single();
        
        if (quizError) {
          console.error("Quiz fetch error:", quizError);
          setLoadError("Quiz not found or has been deactivated");
          toast.error("Quiz not found");
          return;
        }
        
        if (!quizData.is_active) {
          setLoadError("This quiz is not currently active");
          toast.error("This quiz is not currently active");
          return;
        }
        
        const { data: existingSubmission, error: checkError } = await supabase
          .from('submissions')
          .select('id, completed_at, score')
          .eq('quiz_id', quizData.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (checkError) {
          console.error("Error checking existing submissions:", checkError);
        }
        
        if (existingSubmission?.completed_at) {
          console.log("Student already completed this quiz:", existingSubmission);
          localStorage.setItem(`quiz_submission_${quizCode}`, JSON.stringify({
            completed: true,
            score: existingSubmission.score
          }));
          setScore(existingSubmission.score);
          setShowResults(true);
          setIsLoading(false);
          return;
        }
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select(`
            id,
            question_text,
            question_type,
            points,
            order_num
          `)
          .eq('quiz_id', quizData.id)
          .order('order_num');
        
        if (questionsError) {
          console.error("Questions fetch error:", questionsError);
          throw questionsError;
        }
        
        if (!questionsData || questionsData.length === 0) {
          toast.error("This quiz has no questions");
          navigate("/student/attend");
          return;
        }
        
        console.log("Fetched questions:", questionsData);
        
        const questionsWithOptions = await Promise.all(
          questionsData.map(async (question) => {
            const { data: optionsData, error: optionsError } = await supabase
              .from('answer_options')
              .select(`
                id,
                option_text,
                is_correct,
                order_num
              `)
              .eq('question_id', question.id)
              .order('order_num');
            
            if (optionsError) {
              console.error("Options fetch error for question", question.id, ":", optionsError);
              throw optionsError;
            }
            
            return {
              ...question,
              options: optionsData
            };
          })
        );
        
        let subId = submissionId;
        
        // Only create a new submission if we don't already have one
        if (!subId) {
          const { data: submissionData, error: createError } = await supabase
            .from('submissions')
            .insert({
              quiz_id: quizData.id,
              user_id: user.id,
              started_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating submission:", createError);
            throw createError;
          }
          
          console.log("Created submission:", submissionData);
          subId = submissionData.id;
          setSubmissionId(subId);
        }
        
        const quizWithQuestions = {
          ...quizData,
          questions: questionsWithOptions
        };
        
        setQuiz(quizWithQuestions);
        
        // Only set the time if it's not already set (from localStorage)
        if (timeRemaining === 0) {
          const quizTimeLimit = quizData.time_limit ? quizData.time_limit * 60 : 30 * 60;
          setTimeRemaining(quizTimeLimit);
        }
        
        // Save initial state to localStorage
        localStorage.setItem(`quiz_submission_${quizCode}`, JSON.stringify({
          submissionId: subId,
          timeRemaining: timeRemaining || (quizData.time_limit ? quizData.time_limit * 60 : 30 * 60),
          selectedAnswers: {}
        }));
        
        setIsLoading(false);
        setHasInitialized(true);
      } catch (error) {
        console.error("Error fetching quiz:", error);
        setLoadError("Failed to load quiz. Please try again.");
        toast.error("Failed to load quiz");
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadQuiz();
    }
  }, [quizCode, navigate, user, submissionId, timeRemaining, hasInitialized]);
  
  // Timer effect
  useEffect(() => {
    if (!quiz || timeRemaining <= 0 || showResults || isLoading || !hasInitialized) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev <= 1 ? 0 : prev - 1;
        
        // Update localStorage with current state
        if (submissionId) {
          localStorage.setItem(`quiz_submission_${quizCode}`, JSON.stringify({
            submissionId,
            timeRemaining: newTime,
            selectedAnswers
          }));
        }
        
        if (newTime <= 0) {
          clearInterval(timer);
          handleSubmitQuiz();
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quiz, timeRemaining, showResults, isLoading, selectedAnswers, hasInitialized, quizCode, submissionId]);
  
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: optionId,
      };
      
      // Update localStorage with current selections
      if (submissionId) {
        const currentStorage = localStorage.getItem(`quiz_submission_${quizCode}`);
        if (currentStorage) {
          try {
            const storageData = JSON.parse(currentStorage);
            localStorage.setItem(`quiz_submission_${quizCode}`, JSON.stringify({
              ...storageData,
              selectedAnswers: updated
            }));
          } catch (e) {
            console.error("Error updating localStorage", e);
          }
        }
      }
      
      return updated;
    });
  };

  const handleSubmitQuiz = async () => {
    if (!submissionId || !user || !quiz) return;
    
    try {
      console.log("Submitting quiz with submission ID:", submissionId);
      
      const answerPromises = quiz.questions.map(async (question) => {
        const selectedOptionId = selectedAnswers[question.id];
        if (!selectedOptionId) return null;
        
        const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
        const isCorrect = selectedOption ? selectedOption.is_correct : false;
        
        const { error } = await supabase
          .from('answers')
          .insert({
            submission_id: submissionId,
            question_id: question.id,
            selected_option_id: selectedOptionId,
            is_correct: isCorrect
          });
          
        if (error) {
          console.error("Error saving answer:", error);
          throw error;
        }
        
        return { questionId: question.id, isCorrect };
      });
      
      const answers = await Promise.all(answerPromises.filter(Boolean));
      console.log("Saved answers:", answers);
      
      let correctAnswers = 0;
      quiz.questions.forEach((question) => {
        const selectedOptionId = selectedAnswers[question.id];
        if (selectedOptionId) {
          const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
          if (selectedOption && selectedOption.is_correct) {
            correctAnswers++;
          }
        }
      });
      
      const calculatedScore = quiz.questions.length > 0 ? 
        Math.round((correctAnswers / quiz.questions.length) * 100) : 0;
      
      console.log("Calculated score:", calculatedScore);
      
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          completed_at: new Date().toISOString(),
          score: calculatedScore
        })
        .eq('id', submissionId);
      
      if (updateError) {
        console.error("Error updating submission:", updateError);
        throw updateError;
      }
      
      // Mark as completed in localStorage to prevent issues on reload
      localStorage.setItem(`quiz_submission_${quizCode}`, JSON.stringify({
        completed: true,
        score: calculatedScore
      }));
      
      setScore(calculatedScore);
      setShowResults(true);
      toast.success("Quiz submitted successfully!");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading quiz...</p>
        </div>
      </div>
    );
  }
  
  if (loadError || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Quiz Not Found</h2>
          <p className="mb-6">{loadError || "The quiz you're looking for doesn't exist or is no longer active."}</p>
          <Button onClick={() => navigate("/student/attend")}>
            Back to Attend Quiz
          </Button>
        </div>
      </div>
    );
  }
  
  if (showResults) {
    return (
      <MathJaxContext config={mathJaxConfig}>
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Quiz Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-7xl font-bold text-primary mb-2">{score}%</div>
                <p className="text-muted-foreground">
                  You got {quiz.questions.filter((q) => {
                    const selectedOptionId = selectedAnswers[q.id];
                    if (!selectedOptionId) return false;
                    const selectedOption = q.options.find(opt => opt.id === selectedOptionId);
                    return selectedOption && selectedOption.is_correct;
                  }).length} out of {quiz.questions.length} questions correct
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/40">
                <h3 className="font-medium mb-2">Quiz Summary</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Quiz:</span>
                    <span className="font-medium">{quiz.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <span className="font-medium">{quiz.questions.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate("/student/dashboard")}>
                Back to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MathJaxContext>
    );
  }
  
  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-6">
        <div className="container mx-auto max-w-3xl px-4">
          
          <div className="mb-6 sticky top-0 bg-background/95 backdrop-blur-sm p-4 z-10 rounded-lg shadow">
            <h1 className="text-2xl font-bold text-center mb-2">{quiz.title}</h1>
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={`font-mono ${timeRemaining < 60 ? 'text-destructive font-bold' : ''}`}>
                Time Remaining: {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={(selectedAnswers ? Object.keys(selectedAnswers).length : 0) / quiz.questions.length * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-center mt-1">
                {Object.keys(selectedAnswers).length} of {quiz.questions.length} questions answered
              </p>
            </div>
          </div>
          
          <div className="space-y-8 mb-16">
            {quiz.questions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-lg">
                    <MathJax dynamic>
                      {`${index + 1}. ${question.question_text}`}
                    </MathJax>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={selectedAnswers[question.id] || ""}
                    onValueChange={(value) => handleAnswerSelect(question.id, value)}
                  >
                    <div className="grid gap-3">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-start space-x-2 border rounded-md p-3 hover:bg-muted/30 transition-colors">
                          <RadioGroupItem 
                            value={option.id} 
                            id={option.id} 
                            className="mt-1" 
                          />
                          <Label htmlFor={option.id} className="w-full cursor-pointer">
                            <MathJax>{option.option_text}</MathJax>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 border-t backdrop-blur-sm shadow-lg">
            <div className="container mx-auto max-w-3xl flex justify-between items-center">
              <div className="text-sm">
                {Object.keys(selectedAnswers).length} of {quiz.questions.length} questions answered
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={Object.keys(selectedAnswers).length === quiz.questions.length ? "default" : "outline"}
                    size="lg"
                    className={Object.keys(selectedAnswers).length === quiz.questions.length ? "gap-2" : ""}
                  >
                    {Object.keys(selectedAnswers).length === quiz.questions.length && 
                      <div className="size-2 rounded-full bg-white/90 animate-pulse"></div>
                    }
                    Submit Quiz
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {Object.keys(selectedAnswers).length < quiz.questions.length ? (
                        <Alert variant="destructive" className="mb-3">
                          <AlertTitle>Warning</AlertTitle>
                          <AlertDescription>
                            You have only answered {Object.keys(selectedAnswers).length} of {quiz.questions.length} questions.
                            Unanswered questions will be marked as incorrect.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        "You have answered all questions. Once submitted, you cannot change your answers."
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Working</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmitQuiz}>Submit Quiz</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
};

export default TakeQuiz;
