import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Upload,
  Trash,
  Zap,
  Plus,
  Hash,
  Check,
  AlertCircle,
  Eye,
  File,
  Loader2,
  Edit,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import MathImageScanner from "@/components/MathImageScanner";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/svg"] },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
    processEscapes: true,
  },
};

interface ExtractedQuestion {
  text: string;
  options: string[];
  correctOptionIndex: number | null;
}

const CreateTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [questionInputMethod, setQuestionInputMethod] = useState<
    "manual" | "upload"
  >("manual");
  const [editQuizId, setEditQuizId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [currentOptions, setCurrentOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(
    null
  );

  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);

  const [showMathScanner, setShowMathScanner] = useState(false);
  const [scanType, setScanType] = useState<"question" | "options">("question");

  const [showScanOptionDialog, setShowScanOptionDialog] = useState(false);
  const [recognizedOptions, setRecognizedOptions] = useState<string[]>([]);
  const [optionSelectionMode, setOptionSelectionMode] = useState<
    "manual" | "scan"
  >("manual");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get("edit");

    if (editId) {
      setEditQuizId(editId);
      setIsEditMode(true);
      loadQuizForEditing(editId);
    }
  }, [location]);

  const loadQuizForEditing = async (quizId: string) => {
    if (!user) return;

    try {
      setIsLoadingQuiz(true);

      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizError) throw quizError;

      setTitle(quizData.title);
      setDescription(quizData.description || "");
      setTimeLimit(quizData.time_limit);
      setIsActive(quizData.is_active);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_num", { ascending: true });

      if (questionsError) throw questionsError;

      const loadedQuestions = await Promise.all(
        questionsData.map(async (question) => {
          const { data: optionsData, error: optionsError } = await supabase
            .from("answer_options")
            .select("*")
            .eq("question_id", question.id)
            .order("order_num", { ascending: true });

          if (optionsError) throw optionsError;

          const optionTexts = optionsData.map((opt) => opt.option_text);
          const correctIndex = optionsData.findIndex((opt) => opt.is_correct);

          return {
            id: question.id,
            text: question.question_text,
            options: optionTexts,
            correctOptionIndex: correctIndex !== -1 ? correctIndex : 0,
          };
        })
      );

      setQuestions(loadedQuestions);
      setIsLoadingQuiz(false);
    } catch (error) {
      console.error("Error loading quiz for editing:", error);
      toast.error("Failed to load quiz details");
      setIsLoadingQuiz(false);
      navigate("/teacher/tests");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create a quiz");
      return;
    }

    // Check if all questions have answers selected
    const allQuestionsHaveAnswers = questions.every(
      (q) => q.correctOptionIndex !== null
    );
    if (!allQuestionsHaveAnswers) {
      toast.error("All questions must have answers selected");
      return;
    }

    setIsLoading(true);

    try {
      let quizId;

      if (isEditMode && editQuizId) {
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .update({
            title,
            description: description || null,
            time_limit: timeLimit || null,
            is_active: isActive,
          })
          .eq("id", editQuizId)
          .select()
          .single();

        if (quizError) throw quizError;
        quizId = quizData.id;

        const newQuestionIds = questions.filter((q) => q.id).map((q) => q.id);

        const { data: existingQuestions, error: fetchError } = await supabase
          .from("questions")
          .select("id")
          .eq("quiz_id", quizId);

        if (fetchError) throw fetchError;

        for (const existingQuestion of existingQuestions) {
          if (!newQuestionIds.includes(existingQuestion.id)) {
            await supabase
              .from("answer_options")
              .delete()
              .eq("question_id", existingQuestion.id);

            await supabase
              .from("questions")
              .delete()
              .eq("id", existingQuestion.id);
          }
        }
      } else {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            title,
            description: description || null,
            created_by: user.id,
            time_limit: timeLimit || null,
            is_active: isActive,
            code,
          })
          .select()
          .single();

        if (quizError) throw quizError;
        quizId = quizData.id;
      }

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (question.id) {
          const { error: questionError } = await supabase
            .from("questions")
            .update({
              question_text: question.text,
              order_num: i + 1,
            })
            .eq("id", question.id);

          if (questionError) throw questionError;

          const { data: existingOptions, error: optionsError } = await supabase
            .from("answer_options")
            .select("*")
            .eq("question_id", question.id)
            .order("order_num", { ascending: true });

          if (optionsError) throw optionsError;

          for (let j = 0; j < question.options.length; j++) {
            if (j < existingOptions.length) {
              const { error: updateError } = await supabase
                .from("answer_options")
                .update({
                  option_text: question.options[j],
                  is_correct: j === question.correctOptionIndex,
                })
                .eq("id", existingOptions[j].id);

              if (updateError) throw updateError;
            } else {
              const { error: insertError } = await supabase
                .from("answer_options")
                .insert({
                  question_id: question.id,
                  option_text: question.options[j],
                  is_correct: j === question.correctOptionIndex,
                  order_num: j + 1,
                });

              if (insertError) throw insertError;
            }
          }

          if (existingOptions.length > question.options.length) {
            for (
              let j = question.options.length;
              j < existingOptions.length;
              j++
            ) {
              await supabase
                .from("answer_options")
                .delete()
                .eq("id", existingOptions[j].id);
            }
          }
        } else {
          const { data: questionData, error: questionError } = await supabase
            .from("questions")
            .insert({
              quiz_id: quizId,
              question_text: question.text,
              question_type: "multiple_choice",
              order_num: i + 1,
            })
            .select()
            .single();

          if (questionError) throw questionError;

          for (let j = 0; j < question.options.length; j++) {
            const { error: optionError } = await supabase
              .from("answer_options")
              .insert({
                question_id: questionData.id,
                option_text: question.options[j],
                is_correct: j === question.correctOptionIndex,
                order_num: j + 1,
              });

            if (optionError) throw optionError;
          }
        }
      }

      toast.success(
        isEditMode
          ? "Quiz updated successfully!"
          : "Quiz created successfully!",
        { duration: 2000 }
      );
      navigate(`/teacher/tests`);
    } catch (error: any) {
      console.error(
        isEditMode ? "Error updating quiz:" : "Error creating quiz:",
        error
      );
      toast.error(
        error.message ||
          (isEditMode ? "Failed to update quiz" : "Failed to create quiz"),
        { duration: 2000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestionText.trim()) {
      toast.error("Please enter a question", { duration: 2000 });
      return;
    }

    const emptyOptionIndex = currentOptions.findIndex((opt) => !opt.trim());
    if (emptyOptionIndex !== -1) {
      toast.error(`Please fill in option ${emptyOptionIndex + 1}`, {
        duration: 2000,
      });
      return;
    }

    if (correctOptionIndex === null) {
      toast.error("Please select the correct answer", { duration: 2000 });
      return;
    }

    const newQuestion = {
      text: currentQuestionText,
      options: [...currentOptions],
      correctOptionIndex,
    };

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = {
        ...updatedQuestions[editingQuestionIndex],
        ...newQuestion,
      };
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
      toast.success("Question updated", { duration: 2000 });
    } else {
      setQuestions([...questions, newQuestion]);
      toast.success("Question added", { duration: 2000 });
    }

    resetQuestionForm();
  };

  const editQuestion = (index: number) => {
    const question = questions[index];
    setCurrentQuestionText(question.text);
    setCurrentOptions([...question.options]);
    setCorrectOptionIndex(question.correctOptionIndex);
    setEditingQuestionIndex(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetQuestionForm = () => {
    setCurrentQuestionText("");
    setCurrentOptions(["", "", "", ""]);
    setCorrectOptionIndex(null);
    setEditingQuestionIndex(null);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    setCurrentOptions(newOptions);
  };

  const handleInsertQuestion = (extractedQuestion: ExtractedQuestion) => {
    // This now only adds the question to the form but doesn't create the quiz
    const questionToInsert = {
      ...extractedQuestion,
      text: extractedQuestion.text
        .substring(extractedQuestion.text.indexOf(".") + 1)
        .trim(),
    };

    // Check if the question has an answer selected
    if (
      questionToInsert.correctOptionIndex === null &&
      questionToInsert.options.length > 0
    ) {
      toast.warning(
        "No correct answer selected. First option will be set as correct by default."
      );
      questionToInsert.correctOptionIndex = 0;
    }

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = {
        ...updatedQuestions[editingQuestionIndex],
        text: questionToInsert.text,
        options:
          questionToInsert.options.length > 0
            ? questionToInsert.options
            : updatedQuestions[editingQuestionIndex].options,
        correctOptionIndex:
          questionToInsert.correctOptionIndex !== null
            ? questionToInsert.correctOptionIndex
            : 0,
      };
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
      toast.success("Question updated from scanned content");
    } else {
      if (questionToInsert.options.length > 0) {
        setQuestions([
          ...questions,
          {
            text: questionToInsert.text,
            options: questionToInsert.options,
            correctOptionIndex:
              questionToInsert.correctOptionIndex !== null
                ? questionToInsert.correctOptionIndex
                : 0,
          },
        ]);
        toast.success("Question added with options from scan");
      } else {
        setCurrentQuestionText(questionToInsert.text);
        toast.success("Question text inserted from scan");
      }
    }
  };

  const handleInsertText = (text: string) => {
    setCurrentQuestionText(text);
    toast.success("Question text inserted");
  };

  const handleInsertOptionText = (text: string) => {
    const emptyOptionIndex = currentOptions.findIndex((opt) => !opt.trim());

    if (emptyOptionIndex !== -1) {
      const newOptions = [...currentOptions];
      newOptions[emptyOptionIndex] = text;
      setCurrentOptions(newOptions);
    } else {
      const newOptions = [...currentOptions];
      newOptions[0] = text;
      setCurrentOptions(newOptions);
    }

    toast.success("Option text inserted");
  };

  const handleInsertAllQuestions = (questions: ExtractedQuestion[]) => {
    // Ensure all questions have answers
    const allQuestionsHaveAnswers = questions.every(
      (q) => q.correctOptionIndex !== null
    );

    if (!allQuestionsHaveAnswers) {
      toast.error("All questions must have answers selected");
      return;
    }

    // Clean up question texts to avoid double numbering
    // const cleanedQuestions = questions.map((q) => ({
    //   ...q,
    //   text: q.text.substring(q.text.indexOf(".") + 1).trim(),
    // }));

    setQuestions(questions);
    toast.success(`${questions.length} questions added to quiz`);
  };

  const closeMathScanner = () => {
    setShowMathScanner(false);
  };

  console.log(questions);

  if (isLoadingQuiz) {
    return (
      <DashboardLayout navItems={getNavItems("teacher")}>
        <div className="container flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-medium">Loading quiz...</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <MathJaxContext config={mathJaxConfig}>
      <DashboardLayout navItems={getNavItems("teacher")}>
        <div className="container py-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditMode ? "Edit Quiz" : "Create New Quiz"}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode
                  ? "Update your quiz with new content or changes."
                  : "Design a new quiz for your students."}
              </p>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>
                  {isEditMode ? "Quiz Details" : "Quiz Details"}
                </CardTitle>
                <CardDescription>
                  {isEditMode
                    ? "Update the basic information for your quiz."
                    : "Set up the basic information for your new quiz."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter quiz title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter quiz description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">
                    Time Limit (minutes, optional)
                  </Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    value={timeLimit || ""}
                    onChange={(e) =>
                      setTimeLimit(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder="Enter time limit in minutes"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </CardContent>

              <CardHeader className="border-t">
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  {editingQuestionIndex !== null
                    ? "Edit question"
                    : isEditMode
                    ? "Update existing or add new questions to your quiz."
                    : "Add questions to your quiz."}
                </CardDescription>
                <Tabs
                  defaultValue="manual"
                  className="mt-4"
                  value={questionInputMethod}
                  onValueChange={(value) =>
                    setQuestionInputMethod(value as "manual" | "upload")
                  }
                >
                  <TabsList>
                    <TabsTrigger value="manual">Add Manually</TabsTrigger>
                    <TabsTrigger value="upload">
                      Upload Questions
                      <Badge variant="outline" className="ml-2 bg-primary/10">
                        Image/PDF
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="mt-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="questionText">
                            {editingQuestionIndex !== null
                              ? "Edit Question"
                              : "Question Text"}
                          </Label>
                          {editingQuestionIndex !== null && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={resetQuestionForm}
                            >
                              Cancel Editing
                            </Button>
                          )}
                        </div>
                        <div className="relative">
                          <Textarea
                            id="questionText"
                            value={currentQuestionText}
                            onChange={(e) =>
                              setCurrentQuestionText(e.target.value)
                            }
                            placeholder="Enter your question"
                            rows={2}
                          />
                        </div>
                        {currentQuestionText.includes("$") && (
                          <div className="p-3 border rounded-md bg-muted/50">
                            <p className="text-sm font-medium mb-1">Preview:</p>
                            <MathJax>{currentQuestionText}</MathJax>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Options</Label>
                        </div>
                        <div className="space-y-3">
                          {currentOptions.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div className="flex-shrink-0">
                                <Button
                                  type="button"
                                  variant={
                                    correctOptionIndex === index
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="w-10 h-10 rounded-full"
                                  onClick={() => setCorrectOptionIndex(index)}
                                >
                                  {String.fromCharCode(65 + index)}
                                </Button>
                              </div>
                              <div className="flex-grow">
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    handleOptionChange(index, e.target.value)
                                  }
                                  placeholder={`Option ${index + 1}`}
                                />
                                {option.includes("$") && (
                                  <div className="mt-1 p-2 border rounded-md bg-muted/50">
                                    <MathJax>{option}</MathJax>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={addQuestion}
                        className="w-full"
                        variant="secondary"
                      >
                        {editingQuestionIndex !== null ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Update Question
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="p-2 rounded-md bg-amber-50 border border-amber-200 mb-3">
                          <p className="text-sm text-amber-800 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>
                              Upload an image or PDF with math questions. The
                              system will extract questions, options and you can
                              select the correct answer.
                            </span>
                          </p>
                        </div>

                        <MathImageScanner
                          onInsertText={handleInsertText}
                          onInsertQuestion={handleInsertQuestion}
                          onInsertAllQuestions={handleInsertAllQuestions}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>

              <CardContent>
                {questions.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Added Questions ({questions.length})
                    </h3>
                    <div className="space-y-4">
                      {questions.map((q, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-md relative"
                        >
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-primary"
                              onClick={() => editQuestion(index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeQuestion(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mb-3 pr-16">
                            <p className="font-medium">
                              <span className="text-muted-foreground mr-2">
                                {index + 1}.
                              </span>
                              <MathJax>{q.text}</MathJax>
                            </p>
                          </div>

                          <div className="ml-6 space-y-1">
                            {q.options.map(
                              (option: string, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                      optIndex === q.correctOptionIndex
                                        ? "bg-green-100 text-green-800 border border-green-300"
                                        : "bg-muted"
                                    }`}
                                  >
                                    {optIndex === q.correctOptionIndex && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span>
                                    <MathJax>{option}</MathJax>
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-md">
                    <Hash className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">
                      No questions added yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isEditMode
                        ? "Add questions using either the manual form or by uploading a file"
                        : "Add questions using either the manual form or by uploading a file"}
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/teacher/tests")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || questions.length === 0}
                >
                  {isLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Quiz"
                    : "Create Quiz"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </MathJaxContext>
  );
};

export default CreateTest;
