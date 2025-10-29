import { GoogleGenAI, Chat, Type } from "@google/genai";
// Fix: 'TutorMode' is an enum used as a value, so it cannot be a type-only import.
import { type ChatMessage, TutorMode, type QuizProblem, type Difficulty } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const systemInstruction = `
You are Math Mentor AI, an expert and friendly math teacher. Your goal is to help students understand mathematical concepts in a clear, encouraging, and engaging way.

Follow these rules strictly:
1.  **Be a Teacher, Not a Calculator:** Don't just give answers. Explain the concepts, show the step-by-step process, and guide the user to the solution.
2.  **Use Markdown and LaTeX:** Format your responses using markdown for clarity. For all mathematical expressions, equations, and symbols, use LaTeX syntax. Wrap inline math with single dollar signs (e.g., $ax^2 + bx + c = 0$) and block-level equations with double dollar signs (e.g., $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$). This is critical for proper rendering.
3.  **Encouraging Tone:** Use a positive and patient tone. Phrases like "Great question!", "Let's break it down," and "You're on the right track!" are encouraged.
4.  **Clarity is Key:** Simplify complex topics. Use analogies and real-world examples where applicable.
5.  **Interactive Learning:** When appropriate, ask the user questions to check their understanding before moving on. For example, "Does that first step make sense?" or "What do you think we should do next?".
`;

export const generateLesson = async (topicName: string, difficulty: Difficulty): Promise<string> => {
    try {
        const genAI = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `Generate a concise and clear introductory lesson on the topic of "${topicName}" with a difficulty level of "${difficulty}".
        Tailor the complexity of the explanation, the depth of the concepts, and the difficulty of the example and practice problems to this level.
        - For "Easy", use simple language, basic examples, and avoid jargon.
        - For "Medium", assume some prior knowledge and use standard terminology.
        - For "Hard", introduce more advanced concepts, use formal notation, and provide a more challenging practice problem.
        
        Your lesson should be structured with: an engaging introduction, a "Key Concepts" section, a clear, step-by-step "Example Problem", and a final "Practice Problem" for the user. Encourage them to ask for help.
        
        Follow formatting rules strictly:
        - Use Markdown for headings, lists, and bold text.
        - For ALL mathematical expressions, equations, and symbols, use LaTeX syntax. Wrap inline math with single dollar signs (e.g., $y = mx + b$) and block-level equations with double dollar signs (e.g., $$a^2 + b^2 = c^2$$). This is critical.
        - Maintain an encouraging and accessible tone.`;

        const response = await genAI.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        return response.text;
    } catch (error) {
        console.error('Error generating lesson from Gemini:', error);
        throw new Error("Failed to generate lesson content from the AI.");
    }
};

export const generateReview = async (topicName: string): Promise<string> => {
    try {
        const genAI = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `Generate a concise "review sheet" for the topic of "${topicName}". It should be a quick summary of the most important concepts, formulas, and definitions. Use bullet points or numbered lists for easy readability.

        Follow formatting rules strictly:
        - Use Markdown for headings and lists.
        - For ALL mathematical expressions, use LaTeX syntax (e.g., $E=mc^2$). This is critical.`;
        
        const response = await genAI.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error('Error generating review from Gemini:', error);
        throw new Error("Failed to generate review content from the AI.");
    }
};

export const generateChallenge = async (topicName: string): Promise<string> => {
    try {
        const genAI = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `Generate a single, challenging, multi-step problem for the topic of "${topicName}". The problem should require a deeper understanding of the concepts. Present the problem clearly, then encourage the user to try solving it. Do NOT provide the solution upfront.

        Follow formatting rules strictly:
        - Use Markdown for formatting.
        - For ALL mathematical expressions, use LaTeX syntax (e.g., $\\int_0^\\infty e^{-x^2} dx$). This is critical.`;
        
        const response = await genAI.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error('Error generating challenge from Gemini:', error);
        throw new Error("Failed to generate challenge content from the AI.");
    }
};

export const generatePracticeIntro = async (topicName: string): Promise<string> => {
    return Promise.resolve(`Welcome to **Practice Mode** for ${topicName}!
    
    Tell me what kind of problem you want to work on. You can be specific! For example:
    
    *   "Give me a problem about finding the area of a triangle."
    *   "I need to practice solving two-step equations."
    *   "Can you create a word problem involving percentages?"
    
    Let's get practicing! Just type your request below.`);
};

export const getTutorResponse = async (prompt: string, history: ChatMessage[], topicName: string, mode: TutorMode): Promise<string> => {
  try {
    const genAI = getAI();
    let modeInstruction = `The user is currently in "${mode}" mode for the topic "${topicName}". Tailor your response accordingly.`;

    switch(mode) {
        case TutorMode.CHALLENGE:
            modeInstruction += ` In "Challenge" mode, avoid giving the full answer away too easily. Guide the user with hints.`;
            break;
        case TutorMode.REVIEW:
            modeInstruction += ` In "Review" mode, keep things concise and focused on key formulas and concepts.`;
            break;
        case TutorMode.PRACTICE:
            modeInstruction += ` In "Practice" mode, your main goal is to provide practice problems based on the user's request. When they submit a request, generate a suitable problem. Then, guide them through solving it step-by-step.`;
            break;
        case TutorMode.LESSON:
        default:
            modeInstruction += ` In "Lesson" mode, focus on teaching the concepts from scratch.`;
            break;
    }

    const chat = genAI.chats.create({
      model: 'gemini-2.5-flash',
      config: {
          systemInstruction: `${systemInstruction}\n\n${modeInstruction}`,
      },
      history: history.filter(m => !m.quiz), // Exclude quiz data from history
    });
    
    const response = await chat.sendMessage({ message: prompt });
    return response.text;
  } catch (error) {
    console.error('Error getting response from Gemini:', error);
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
};

export const getAlgebraExplanation = async (equation: string): Promise<string> => {
    try {
      const genAI = getAI();
      const model = 'gemini-2.5-flash';
      const prompt = `
        Provide a clear, step-by-step explanation for how to solve the following algebraic equation for 'x':
        Equation: "${equation}"

        Your explanation should be easy for a middle school student to understand.
        Break down each step logically.
        
        Strictly follow these formatting rules:
        - Use Markdown for lists and emphasis.
        - For ALL mathematical expressions, variables (like 'x'), numbers, and equations, use LaTeX syntax. Wrap inline math with single dollar signs (e.g., $2x + 5 = 15$) and block-level equations with double dollar signs (e.g., $$x = 5$$). This is critical for rendering.
      `;

      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error(`Error generating explanation for "${equation}":`, error);
      throw new Error("Failed to generate explanation from the AI.");
    }
  };
  
export const generateQuiz = async (topicName: string): Promise<QuizProblem[]> => {
    try {
        const genAI = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `Generate a 3-question multiple-choice quiz about "${topicName}". Each question should have 4 options. Ensure the questions cover fundamental concepts of the topic. Ensure there is only one correct answer per question. For any math in the questions or options, use inline LaTeX.`;

        const response = await genAI.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    questionText: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswerIndex: { type: Type.INTEGER },
                                },
                            },
                        },
                    },
                },
            },
        });

        const jsonString = response.text;
        const quizObject = JSON.parse(jsonString);
        return quizObject.questions;

    } catch (error) {
        console.error('Error generating quiz from Gemini:', error);
        throw new Error("Failed to generate quiz from the AI.");
    }
};

export const gradeQuiz = async (topicName: string, questions: QuizProblem[], userAnswers: number[]): Promise<{ score: number, feedback: string }> => {
    try {
        const genAI = getAI();
        const model = 'gemini-2.5-flash';

        let correctCount = 0;
        const detailedResults = questions.map((q, i) => {
            const isCorrect = q.correctAnswerIndex === userAnswers[i];
            if (isCorrect) correctCount++;
            return {
                question: q.questionText,
                userAnswer: q.options[userAnswers[i]] || "Not answered",
                correctAnswer: q.options[q.correctAnswerIndex],
                isCorrect: isCorrect,
            };
        });

        const score = Math.round((correctCount / questions.length) * 100);

        const prompt = `
            A student just took a quiz on "${topicName}". Here are their results:
            ${JSON.stringify(detailedResults, null, 2)}

            Please provide a brief, encouraging, and helpful feedback message for the student based on their performance. 
            - If they did well, congratulate them.
            - For any questions they got wrong, briefly explain the correct concept without being too verbose.
            - Maintain the persona of a friendly and supportive math tutor.
            - Use Markdown and LaTeX for formatting.
        `;

        const response = await genAI.models.generateContent({
            model: model,
            contents: prompt,
        });

        return { score, feedback: response.text };

    } catch (error) {
        console.error('Error grading quiz with Gemini:', error);
        throw new Error("Failed to get quiz feedback from the AI.");
    }
};