import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout, { getNavItems } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MathJaxContext, MathJax } from "better-react-mathjax";
import MathImageScanner from '@/components/MathImageScanner';
import { Info, CheckCircle2, FileUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/svg"] },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
    packages: ['base', 'ams', 'noerrors', 'noundefined', 'physics', 'boldsymbol'],
    macros: {
      '\\RR': '\\mathbb{R}',
      '\\NN': '\\mathbb{N}',
      '\\ZZ': '\\mathbb{Z}',
      '\\QQ': '\\mathbb{Q}',
      '\\CC': '\\mathbb{C}'
    }
  },
  svg: {
    fontCache: 'global'
  }
};

interface ExtractedQuestion {
  text: string;
  options: string[];
  correctOptionIndex: number | null;
  imageUrl?: string;
}

const MathScannerDemo = () => {
  const { user } = useAuth();
  const [mathText, setMathText] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<ExtractedQuestion | null>(null);
  const [rawJsonData, setRawJsonData] = useState<any>(null);
  const [allQuestions, setAllQuestions] = useState<ExtractedQuestion[]>([]);
  const [questionsInserted, setQuestionsInserted] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  const handleInsertText = (text: string) => {
    setMathText((prev) => prev + ' ' + text);
  };
  
  const handleInsertQuestion = (question: ExtractedQuestion) => {
    if (questionsInserted) {
      // Prevent duplicate insertions
      return;
    }
    
    // Ensure question has an answer selected
    if (question.correctOptionIndex === null) {
      toast.error("Please select an answer for this question");
      return;
    }
    
    // Clean up question text to remove double numbering
    const questionText = question.text;
    const cleanedText = questionText.substring(questionText.indexOf('.') + 1).trim();
    
    const cleanedQuestion = {
      ...question,
      text: cleanedText
    };
    
    setSelectedQuestion(cleanedQuestion);
    setMathText(cleanedText);
    setQuestionsInserted(true);
    
    // Reset flag after a delay
    setTimeout(() => {
      setQuestionsInserted(false);
    }, 1000);
  };

  const handleInsertAllQuestions = (questions: ExtractedQuestion[]) => {
    if (questionsInserted) {
      // Prevent duplicate insertions
      return;
    }
    
    // Make sure all questions have answers before inserting
    const allQuestionsHaveAnswers = questions.every(q => q.correctOptionIndex !== null);
    if (!allQuestionsHaveAnswers) {
      toast.error("All questions must have answers selected");
      return;
    }
    
    // Clean up question texts to remove double numbering
    const cleanedQuestions = questions.map((q, index) => {
      const questionText = q.text;
      const cleanedText = questionText.substring(questionText.indexOf('.') + 1).trim();
      
      return {
        ...q,
        text: (index + 1) + ". " + cleanedText
      };
    });
    
    setAllQuestions(cleanedQuestions);
    
    if (cleanedQuestions.length > 0) {
      setSelectedQuestion(cleanedQuestions[0]);
      setMathText(cleanedQuestions[0].text.substring(cleanedQuestions[0].text.indexOf('.') + 1).trim());
      toast.success(`${cleanedQuestions.length} questions inserted`);
      setQuestionsInserted(true);
      
      // Reset flag after a delay
      setTimeout(() => {
        setQuestionsInserted(false);
      }, 1000);
    }
  };

  const handleJsonData = (data: any) => {
    setRawJsonData(data);
  };
  
  const handlePreviewImage = (imageUrl?: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setShowImagePreview(true);
    }
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <DashboardLayout navItems={getNavItems(user?.role || 'student')}>
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">Math Formula Scanner</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <MathImageScanner 
                onInsertText={handleInsertText} 
                onInsertQuestion={handleInsertQuestion}
                onJsonData={handleJsonData}
                onInsertAllQuestions={handleInsertAllQuestions}
              />
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Math Editor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={mathText}
                    onChange={(e) => setMathText(e.target.value)}
                    placeholder="Type or insert math here..."
                    rows={6}
                    className="mb-4"
                  />
                  
                  <div className="border rounded-md p-4 min-h-[150px] bg-muted/20">
                    <h3 className="text-sm font-medium mb-2">Preview:</h3>
                    <MathJax>{mathText}</MathJax>
                  </div>
                  
                  {selectedQuestion && selectedQuestion.options.length > 0 && (
                    <div className="mt-4 border rounded-md p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <h3 className="text-sm font-medium">Multiple Choice Options</h3>
                        <Badge variant="outline" className="bg-primary/10">MCQ</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center p-2 rounded-md border">
                            <div className={`w-6 h-6 mr-2 rounded-full flex items-center justify-center ${index === selectedQuestion.correctOptionIndex ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-muted'}`}>
                              {index === selectedQuestion.correctOptionIndex && (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </div>
                            <MathJax>{option}</MathJax>
                          </div>
                        ))}
                      </div>
                      
                      {selectedQuestion.imageUrl && (
                        <div className="mt-3 pt-3 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePreviewImage(selectedQuestion.imageUrl)}
                          >
                            <FileUp className="h-4 w-4 mr-2" />
                            View Question Image
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {allQuestions.length > 1 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">All Questions ({allQuestions.length})</h3>
                      <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
                        {allQuestions.map((q, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2 text-sm cursor-pointer hover:bg-muted/50 ${selectedQuestion === q ? 'bg-primary/10' : ''}`}
                            onClick={() => {
                              setSelectedQuestion(q);
                              setMathText(q.text.substring(q.text.indexOf('.') + 1).trim());
                            }}
                          >
                            <div className="flex items-center">
                              <span className="font-medium mr-2">{idx + 1}.</span>
                              <span className="truncate">{q.text.substring(q.text.indexOf('.') + 1).trim().substring(0, 30)}...</span>
                              {q.correctOptionIndex !== null && (
                                <Badge className="ml-auto text-xs" variant="outline">
                                  Answer: {String.fromCharCode(65 + q.correctOptionIndex)}
                                </Badge>
                              )}
                              {q.imageUrl && (
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 ml-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewImage(q.imageUrl);
                                  }}
                                >
                                  <FileUp className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-200 mb-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">This demo works with specific test files. Please upload only the supported test files: test_1.pdf, test_2.pdf, or test_4.pdf.</p>
                  </div>
                  <p>1. Upload one of the supported PDF files</p>
                  <p>2. Click "Scan PDF" to process the content</p>
                  <p>3. You'll see extracted questions with multiple-choice options</p>
                  <p>4. You'll need to select answers for each question or upload an answer key file (ans_1.pdf, ans_2.pdf, or ans_4.pdf)</p>
                  <p>5. Select questions to view and answer them in detail</p>
                  <p>6. Click "Insert All Questions" to add all questions to the editor</p>
                  <Alert className="mt-4 bg-muted/30">
                    <AlertDescription>
                      You must select answers for questions or upload an answer key before inserting questions.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Image Preview Modal */}
          {showImagePreview && previewImageUrl && (
            <div 
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
              onClick={() => setShowImagePreview(false)}
            >
              <div 
                className="bg-white p-4 rounded-lg max-w-3xl max-h-[80vh] overflow-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Question Image</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowImagePreview(false)}
                  >
                    ✕
                  </Button>
                </div>
                <img 
                  src={previewImageUrl} 
                  alt="Question diagram" 
                  className="max-w-full h-auto"
                  onError={() => {
                    toast.error("Failed to load image");
                    setShowImagePreview(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </MathJaxContext>
  );
};

export default MathScannerDemo;
