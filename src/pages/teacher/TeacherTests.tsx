import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Trash, Edit, Eye, Link as LinkIcon, MoreHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import SubmissionsList from "@/components/SubmissionsList";

const TeacherTests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [selectedTestQuestions, setSelectedTestQuestions] = useState<any[]>([]);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [showEditQuestionDialog, setShowEditQuestionDialog] = useState(false);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionOptions, setEditQuestionOptions] = useState<string[]>([]);
  const [editQuestionCorrectIndex, setEditQuestionCorrectIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchTeacherTests();
    }
  }, [user]);
  
  const fetchTeacherTests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          submissions (
            id
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const processedTests = data.map(test => ({
        ...test,
        submissionCount: test.submissions ? test.submissions.length : 0
      }));
      
      setTests(processedTests);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching teacher tests:", error);
      toast.error("Failed to load tests");
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
      
      const userIds = Array.from(new Set(submissionsData.map(sub => sub.user_id)));
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }
      
      const processedSubmissions = submissionsData.map(submission => {
        const profile = profilesData?.find(p => p.id === submission.user_id);
        
        return {
          ...submission,
          profiles: profile || { name: "Unknown", email: "No email" }
        };
      });
      
      setSubmissions(processedSubmissions);
      setShowSubmissions(true);
      setIsLoadingSubmissions(false);
    } catch (error) {
      console.error("Error fetching test submissions:", error);
      toast.error("Failed to load submissions");
      setIsLoadingSubmissions(false);
    }
  };

  const fetchTestQuestions = async (testId: string) => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', testId)
        .order('order_num', { ascending: true });
      
      if (questionsError) throw questionsError;
      
      const questionsWithOptions = await Promise.all(
        questionsData.map(async (question) => {
          const { data: optionsData, error: optionsError } = await supabase
            .from('answer_options')
            .select('*')
            .eq('question_id', question.id)
            .order('order_num', { ascending: true });
          
          if (optionsError) throw optionsError;
          
          return {
            ...question,
            options: optionsData || [],
            correctOption: optionsData?.find(opt => opt.is_correct)
          };
        })
      );
      
      setSelectedTestQuestions(questionsWithOptions);
      setShowQuestionsDialog(true);
    } catch (error) {
      console.error("Error fetching test questions:", error);
      toast.error("Failed to load questions");
    }
  };
  
  const handleDeleteTest = async () => {
    if (!selectedTest) return;
    
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', selectedTest.id);
      
      if (error) throw error;
      
      toast.success("Test deleted successfully");
      setTests(tests.filter(test => test.id !== selectedTest.id));
      setShowDeleteDialog(false);
      setSelectedTest(null);
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("Failed to delete test");
    }
  };
  
  const handleToggleActive = async (test: any) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: !test.is_active })
        .eq('id', test.id);
      
      if (error) throw error;
      
      setTests(tests.map(t => 
        t.id === test.id ? { ...t, is_active: !test.is_active } : t
      ));
      
      toast.success(`Test ${test.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error("Error toggling test status:", error);
      toast.error("Failed to update test status");
    }
  };
  
  const copyQuizCode = () => {
    if (selectedTest && selectedTest.code) {
      navigator.clipboard.writeText(selectedTest.code);
      toast.success("Quiz code copied to clipboard!");
    }
  };

  const handleEditTest = (test: any) => {
    navigate(`/teacher/create?edit=${test.id}`);
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setEditQuestionText(question.question_text);
    
    const options = question.options.map((opt: any) => opt.option_text);
    setEditQuestionOptions([...options]);
    
    const correctOptionIndex = question.options.findIndex((opt: any) => opt.is_correct);
    setEditQuestionCorrectIndex(correctOptionIndex !== -1 ? correctOptionIndex : null);
    
    setShowEditQuestionDialog(true);
  };
  
  const saveEditedQuestion = async () => {
    if (!editingQuestion || !editQuestionText.trim() || editQuestionCorrectIndex === null) {
      toast.error("Please fill in all question fields");
      return;
    }
    
    try {
      const { error: questionError } = await supabase
        .from('questions')
        .update({ question_text: editQuestionText })
        .eq('id', editingQuestion.id);
      
      if (questionError) throw questionError;
      
      for (let i = 0; i < editingQuestion.options.length; i++) {
        const option = editingQuestion.options[i];
        const { error: optionError } = await supabase
          .from('answer_options')
          .update({ 
            option_text: editQuestionOptions[i],
            is_correct: i === editQuestionCorrectIndex
          })
          .eq('id', option.id);
        
        if (optionError) throw optionError;
      }
      
      if (selectedTest) {
        await fetchTestQuestions(selectedTest.id);
      }
      
      toast.success("Question updated successfully");
      setShowEditQuestionDialog(false);
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Failed to update question");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error: optionsError } = await supabase
        .from('answer_options')
        .delete()
        .eq('question_id', questionId);
      
      if (optionsError) throw optionsError;
      
      const { error: questionError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);
      
      if (questionError) throw questionError;
      
      setSelectedTestQuestions(questions => questions.filter(q => q.id !== questionId));
      toast.success("Question deleted successfully");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...editQuestionOptions];
    newOptions[index] = value;
    setEditQuestionOptions(newOptions);
  };

  return (
    <DashboardLayout navItems={getNavItems("teacher")}>
      <div className="p-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Tests</h1>
              <p className="text-muted-foreground">Manage your quizzes and tests</p>
            </div>
            <Button 
              className="flex items-center gap-2"
              onClick={() => navigate('/teacher/create')}
            >
              <PlusCircle className="h-4 w-4" />
              Create New Test
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Your Tests</CardTitle>
              <CardDescription>
                View and manage all your created tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search tests..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your tests...</p>
                </div>
              ) : filteredTests.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Code</TableHead>
                        <TableHead className="hidden md:table-cell">Submissions</TableHead>
                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTests.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell className="font-medium">{test.title}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="font-mono">
                              {test.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{test.submissionCount}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge className={test.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"} variant="outline">
                              {test.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {formatDate(test.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  className="flex items-center gap-2"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    fetchTestSubmissions(test.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  View Submissions
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="flex items-center gap-2"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    fetchTestQuestions(test.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  View Questions
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="flex items-center gap-2"
                                  onClick={() => handleEditTest(test)}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Test
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="flex items-center gap-2"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    setShowShareDialog(true);
                                  }}
                                >
                                  <LinkIcon className="h-4 w-4" />
                                  Share Quiz Code
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="flex items-center gap-2"
                                  onClick={() => handleToggleActive(test)}
                                >
                                  {test.is_active ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pause">
                                        <rect x="6" y="4" width="4" height="16"/>
                                        <rect x="14" y="4" width="4" height="16"/>
                                      </svg>
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                      </svg>
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 text-destructive"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 border rounded-md">
                  <p className="text-muted-foreground mb-4">You haven't created any tests yet.</p>
                  <Link to="/teacher/create">
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Your First Test
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {selectedTest && (
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Quiz Code</DialogTitle>
              <DialogDescription>
                Students can use this code to access your quiz
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="text-center">
                <div className="font-mono text-3xl font-bold tracking-wider bg-muted p-4 rounded-md inline-block">
                  {selectedTest.code}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Share this code with your students. They can enter it on the Attend Quiz page.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={copyQuizCode}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="lucide lucide-copy mr-2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {selectedTest && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the test "{selectedTest.title}" and all associated questions and submissions.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteTest}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
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
      
      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Test Questions</DialogTitle>
            <DialogDescription>
              View and manage questions for the selected test
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTestQuestions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question Text</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTestQuestions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell>{question.question_text}</TableCell>
                        <TableCell>{question.question_type}</TableCell>
                        <TableCell>{question.points}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No questions found for this test</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showEditQuestionDialog} onOpenChange={setShowEditQuestionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="questionText" className="text-sm font-medium">Question Text</label>
              <Input
                id="questionText"
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Options</label>
              <div className="space-y-3">
                {editQuestionOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={editQuestionCorrectIndex === index ? "default" : "outline"}
                      size="sm"
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      onClick={() => setEditQuestionCorrectIndex(index)}
                    >
                      {String.fromCharCode(65 + index)}
                    </Button>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowEditQuestionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedQuestion}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherTests;
