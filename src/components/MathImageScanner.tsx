import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { Upload } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Input } from "@/components/ui/input";
import { extractTextFromPDF } from "@/lib/pdfExtractor";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true,
    packages: ['base', 'ams', 'noerrors', 'noundefined', 'physics', 'boldsymbol'],
    macros: {
      '\\RR': '\\mathbb{R}',
      '\\NN': '\\mathbb{N}',
      '\\ZZ': '\\mathbb{Z}',
      '\\QQ': '\\mathbb{Q}',
      '\\CC': '\\mathbb{C}',
      '\\infty': '\\infty',
      '\\sqrt': '\\sqrt',
      '\\frac': '\\frac',
      '\\cap': '\\cap',
      '\\cup': '\\cup',
      '\\setminus': '\\setminus'
    }
  },
  chtml: {
    displayAlign: 'left',
    displayIndent: '2em'
  }
};

interface QuizQuestion {
  text: string;
  options: string[];
}

interface QuizQuestionWithAnswer extends QuizQuestion {
  selectedAnswer: number;
}

interface MathImageScannerProps {
  onInsertText?: (text: string) => void;
  onInsertQuestion?: (QuizQuestion) => void;
  onJsonData?: (data: any) => void;
  onInsertAllQuestions?: (questions: QuizQuestionWithAnswer[]) => void;
  onQuestionsExtracted?: (questions: QuizQuestion[]) => void;
  onError?: (error: Error) => void;
}

enum ProcessStage {
  Initial = 0,
  FileUploaded = 25,
  Processing = 50,
  QuestionsReady = 75,
  AnswersLoaded = 100
}

const formatLatex = (text: string): string => {
  if (!text) return '';
  
  // First, clean up any double-wrapped delimiters
  text = text.replace(/\\\(\\\(/g, '\\(').replace(/\\\)\\\)/g, '\\)');
  text = text.replace(/\\\[\\\[/g, '\\[').replace(/\\\]\\\]/g, '\\]');
  text = text.replace(/\$\$/g, '$');
  
  // Check if the text contains any LaTeX commands or math symbols
  const hasMathContent = /[\\$]|[\^_]|[\{\}]/.test(text);
  
  // If the text is already properly wrapped in LaTeX delimiters, return it as is
  if (text.match(/^\\\(.*\\\)$/) || text.match(/^\\\[.*\\\]$/) || text.match(/^\$.*\$$/)) {
    return text;
  }
  
  // Clean up any double spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  // Only wrap in LaTeX delimiters if it contains math content
  return hasMathContent ? `\\(${text}\\)` : text;
};

const parseQuestionText = (text: string): { questionText: string, options: string[] } => {
  if (!text) return { questionText: '', options: [] };
  
  try {
    // Split the text into question and options
    const parts = text.split(/(?=[A-E]\.)/);
    if (parts.length < 2) return { questionText: text, options: [] };
    
    const questionText = parts[0].trim();
    const options = parts.slice(1).map(opt => opt.trim());
    
    return { questionText, options };
  } catch (error) {
    console.error('Error parsing question text:', error);
    return { questionText: text, options: [] };
  }
};

const MathImageScanner: React.FC<MathImageScannerProps> = ({
  onInsertText,
  onInsertQuestion,
  onJsonData,
  onInsertAllQuestions,
  onQuestionsExtracted,
  onError
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [addedQuestions, setAddedQuestions] = useState<QuizQuestionWithAnswer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState<ProcessStage>(ProcessStage.Initial);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<QuizQuestion | null>(null);

  useEffect(() => {
    if (notification) {
      if (notification.type === 'success') {
        toast.success(notification.message, {
          duration: 3000,
          position: "top-center",
        });
      } else {
        toast.error(notification.message, {
          duration: 3000,
          position: "top-center",
        });
      }
      setNotification(null);
    }
  }, [notification]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setQuestions([]);
    setAddedQuestions([]);
    setSelectedAnswers({});
    setExtractedText("");

    try {
        console.log('Sending PDF to server...');
        const extractedData = await extractTextFromPDF(file);
        console.log('Received response:', extractedData);

        if (!extractedData.text) {
            throw new Error('No text could be extracted from the PDF');
        }

        // Remove page markers
        const cleanText = extractedData.text.replace(/--- Page \d+ ---\n?/g, '');
        
        // Split by question numbers (1., 2., etc.)
        const questionBlocks = cleanText.split(/(?=\d+\.)/).filter(block => block.trim());
        console.log('Question blocks:', questionBlocks);

        const processedQuestions = [];
        
        for (const block of questionBlocks) {
            // Get the question text (everything before the first option)
            const questionMatch = block.match(/^\d+\.(.*?)(?=\(A\))/s);
            if (!questionMatch) continue;
            
            const questionText = questionMatch[1].trim();
            
            // Get all options
            const options = [];
            // const optionMatches = block.matchAll(/\(([A-E])\)(.*?)(?=\([A-E]\)|$)/gs);
            const optionMatches = block.matchAll(/(?:^|\s)\(([A-E])\)\s*(.*?)(?=\s*\([A-E]\)|$)/gs);

            for (const match of optionMatches) {
                const optionText = match[2].trim();
                if (optionText) {
                    options.push(optionText);
                }
            }

            if (questionText && options.length > 0) {
                processedQuestions.push({
                    text: questionText,
                    options: options
                });
            }
        }

        console.log('Processed questions:', processedQuestions);
        setQuestions(processedQuestions);
        console.log("questions: ",questions)
        
        if (processedQuestions.length === 0) {
            toast.warning('No questions could be extracted from the PDF');
        } else {
            toast.success(`Successfully extracted ${processedQuestions.length} questions`);
        }
        
    } catch (error) {
        console.error('Error processing PDF:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to process PDF');
    } finally {
        setIsProcessing(false);
    }
  };

  console.log("Questions to upload",questions);
  console.log("Added Questions",addedQuestions);

  const canSubmitQuiz = (): boolean => {
    return questions.length > 0 && 
           Object.keys(selectedAnswers).length === questions.length;
  };

  const addQuestions = () => {
    if (!canSubmitQuiz()) {
      setNotification({
        type: 'error',
        message: "Please select an option for all questions"
      });
      return;
    }
    
    // Create questions with answers
    const questionsWithAnswers = questions.map((question, index) => ({
      ...question,
      selectedAnswer: selectedAnswers[index] || 0,
      correctOptionIndex: selectedAnswers[index] || 0  // Add this for compatibility
    }));

    // Update the added questions list
    setAddedQuestions(questionsWithAnswers);

    // Call the appropriate callback
    if (onInsertAllQuestions) {
      onInsertAllQuestions(questionsWithAnswers);
      setNotification({
        type: 'success',
        message: `${questionsWithAnswers.length} questions added successfully`
      });
    } else if (onInsertQuestion && questionsWithAnswers.length > 0) {
      // If we only have onInsertQuestion, insert the first question
      onInsertQuestion(questionsWithAnswers[0]);
      setNotification({
        type: 'success',
        message: "Question added successfully"
      });
    }

    // Clear the form for next upload
    setQuestions([]);
    setSelectedAnswers({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, qIndex) => qIndex !== index);
    setQuestions(updatedQuestions);

    // Update selected answers
    const updatedSelectedAnswers: Record<number, number> = {};
    Object.entries(selectedAnswers).forEach(([key, value]) => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        updatedSelectedAnswers[keyNum] = value;
      } else if (keyNum > index) {
        updatedSelectedAnswers[keyNum - 1] = value;
      }
    });
    
    setSelectedAnswers(updatedSelectedAnswers);
    setEditingQuestion(null);
    setEditedQuestion(null);
    setNotification({
      type: 'success',
      message: "Question deleted successfully"
    });
  };
  
  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    // Update the selected answers
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
    
    // Update the questions array with the selected answer
    const updatedQuestions = questions.map((q, idx) => {
      if (idx === questionIndex) {
        return {
          ...q,
          selectedAnswer: optionIndex
        };
      }
      return q;
    });
    setQuestions(updatedQuestions);
    
    // Also update the addedQuestions array if it exists
    if (addedQuestions.length > 0) {
      const updatedAddedQuestions = addedQuestions.map((q, idx) => {
        if (idx === questionIndex) {
          return {
            ...q,
            selectedAnswer: optionIndex
          };
        }
        return q;
      });
      setAddedQuestions(updatedAddedQuestions);
    }
  };

  const startEditing = (index: number) => {
    setEditingQuestion(index);
    setEditedQuestion(questions[index]);
  };

  const saveEdit = () => {
    if (editingQuestion !== null && editedQuestion) {
        const newQuestions = [...questions];
        newQuestions[editingQuestion] = editedQuestion;
        setQuestions(newQuestions);
        setEditingQuestion(null);
        setEditedQuestion(null);
        toast.success('Question updated successfully');
    }
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setEditedQuestion(null);
  };

  const renderQuestion = (question: QuizQuestion, index: number) => {
    console.log(question.text)
    return (
      <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-medium mb-2">
          <MathJax dynamic>{question.text}</MathJax>
          </div>
          <div className="space-y-2">
            {question.options.map((option, optIndex) => (
              <div
                key={optIndex}
                className={`flex items-center p-2 rounded-md border cursor-pointer ${
                  selectedAnswers[index] === optIndex
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => handleAnswerSelect(index, optIndex)}
              >
                <div className="w-6 h-6 mr-2 rounded-full flex items-center justify-center border">
                  {String.fromCharCode(65 + optIndex)}
                </div>
                <MathJax inline>{option}</MathJax>
              </div>
            ))}
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <Button variant="outline" size="sm" onClick={() => startEditing(index)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => deleteQuestion(index)}>
            Delete
          </Button>
        </div>
      </div>
      {selectedAnswers[index] !== undefined && (
        <div className="mt-2 text-sm text-green-600">
          Selected answer: {String.fromCharCode(65 + selectedAnswers[index])}
        </div>
      )}
    </div>
    );
  };

  const renderEditForm = (question: QuizQuestion, index: number) => {
    return (
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <div className="space-y-4">
          <div>
            <Label>Question Text</Label>
            <Textarea
              value={editedQuestion?.text || ''}
              onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, text: e.target.value } : null)}
              className="mt-1"
            />
            <div className="mt-2">
              <MathJax inline>
                {formatLatex(editedQuestion?.text || '')}
              </MathJax>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            {editedQuestion?.options.map((option, optIndex) => (
              <div key={optIndex} className="flex items-center space-x-2">
                <Textarea
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(editedQuestion?.options || [])];
                    newOptions[optIndex] = e.target.value;
                    setEditedQuestion(prev => prev ? { ...prev, options: newOptions } : null);
                  }}
                  className="flex-1"
                />
                <div className="w-6 h-6 rounded-full flex items-center justify-center border">
                  {String.fromCharCode(65 + optIndex)}
                </div>
                <div className="w-32">
                  <MathJax inline>
                    {formatLatex(option)}
                  </MathJax>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={cancelEdit}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveEdit}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <Toaster richColors position="top-center" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>PDF Question Extractor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="pdf-upload">Upload PDF</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing PDF...</span>
                </div>
              )}
            </div>

            {questions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Extracted Questions</h3>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    editingQuestion === index ? 
                        renderEditForm(question, index) :
                        renderQuestion(question, index)
                  ))}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    onClick={addQuestions}
                    disabled={!canSubmitQuiz()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Add Questions
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </MathJaxContext>
  );
};

export default MathImageScanner;
