
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const createDummyQuiz = async (userId: string) => {
  try {
    // Generate a random code for the quiz
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create the quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title: "Sample Physics Quiz",
        description: "A sample quiz covering basic concepts in physics",
        created_by: userId,
        time_limit: 15, // 15 minutes
        is_active: true,
        code
      })
      .select()
      .single();
    
    if (quizError) throw quizError;
    
    // Sample questions
    const questions = [
      {
        text: "What is the SI unit of force?",
        options: ["Newton", "Watt", "Joule", "Ampere"],
        correctOptionIndex: 0
      },
      {
        text: "Which of the following is a vector quantity?",
        options: ["Mass", "Temperature", "Velocity", "Time"],
        correctOptionIndex: 2
      },
      {
        text: "A body moving with constant speed has:",
        options: [
          "No acceleration", 
          "Constant acceleration", 
          "Variable acceleration", 
          "Cannot be determined"
        ],
        correctOptionIndex: 0
      },
      {
        text: "According to Newton's second law, $F = ma$, what happens to acceleration when force is doubled?",
        options: [
          "Acceleration becomes half", 
          "Acceleration doubles", 
          "Acceleration remains the same", 
          "Acceleration becomes zero"
        ],
        correctOptionIndex: 1
      },
      {
        text: "The formula for kinetic energy is:",
        options: [
          "$E_k = mv^2$", 
          "$E_k = \\frac{1}{2}mv^2$", 
          "$E_k = mgh$", 
          "$E_k = \\frac{mv}{2}$"
        ],
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
    
    return { success: true, quizId: quizData.id, quizCode: code };
  } catch (error: any) {
    console.error("Error creating dummy quiz:", error);
    return { success: false, error: error.message };
  }
};
