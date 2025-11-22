
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const createInitialQuiz = async (userId: string) => {
  try {
    // Check if the user already has quizzes
    const { count } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);
    
    // Only create a quiz if the user doesn't have any
    if (count && count > 0) {
      console.log("User already has quizzes, skipping initial quiz creation");
      return { success: true, skipped: true };
    }
    
    // Generate a random code for the quiz
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create the quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title: "Basic Math Quiz",
        description: "A simple quiz covering basic math concepts",
        created_by: userId,
        time_limit: 10, // 10 minutes
        is_active: true,
        code
      })
      .select()
      .single();
    
    if (quizError) throw quizError;
    
    // Sample questions
    const questions = [
      {
        text: "What is 5 + 7?",
        options: ["10", "12", "15", "11"],
        correctOptionIndex: 1
      },
      {
        text: "What is 8 × 9?",
        options: ["63", "72", "81", "64"],
        correctOptionIndex: 1
      },
      {
        text: "What is 20 ÷ 4?",
        options: ["4", "5", "6", "8"],
        correctOptionIndex: 1
      }
    ];
    
    // Add each question and its options
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizData.id,
          question_text: question.text,
          question_type: "multiple_choice",
          order_num: i + 1
        })
        .select()
        .single();
      
      if (questionError) throw questionError;
      
      // Add options for each question
      for (let j = 0; j < question.options.length; j++) {
        const { error: optionError } = await supabase
          .from('answer_options')
          .insert({
            question_id: questionData.id,
            option_text: question.options[j],
            is_correct: j === question.correctOptionIndex,
            order_num: j + 1
          });
        
        if (optionError) throw optionError;
      }
    }
    
    console.log("Initial quiz created successfully");
    return { success: true, quizId: quizData.id, quizCode: code };
  } catch (error: any) {
    console.error("Error creating initial quiz:", error);
    return { success: false, error: error.message };
  }
};
