import React, { useState, useEffect, useRef } from 'react';
import { generateLesson, getTutorResponse, generateChallenge, generateReview, generateQuiz, gradeQuiz, generatePracticeIntro } from '../services/geminiService';
import type { MathTopic, ChatMessage, QuizData, QuizProblem, Difficulty } from '../types';
import { TutorMode } from '../types';
import { UserIcon, BrainCircuitIcon, SendIcon, RefreshCwIcon, CrosshairIcon, BookOpenIcon, ClipboardCheckIcon, TargetIcon } from './Icons';
import { recordPerformance } from '../services/srsService';

interface AITutorProps {
  selectedTopic: MathTopic | null;
  setSelectedTopic: (topic: MathTopic | null) => void;
  initialMode: TutorMode;
}

const LoadingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const ModeSelector: React.FC<{ selectedMode: TutorMode, onSelectMode: (mode: TutorMode) => void }> = ({ selectedMode, onSelectMode }) => {
    const modes = [
        { mode: TutorMode.LESSON, icon: BookOpenIcon, label: 'Lesson' },
        { mode: TutorMode.REVIEW, icon: RefreshCwIcon, label: 'Review' },
        { mode: TutorMode.CHALLENGE, icon: CrosshairIcon, label: 'Challenge' },
        { mode: TutorMode.PRACTICE, icon: TargetIcon, label: 'Practice' },
    ];
    return (
        <div className="flex justify-center p-1 bg-slate-200 dark:bg-gray-950 rounded-full">
            {modes.map(({mode, icon: Icon, label}) => (
                <button 
                    key={mode} 
                    onClick={() => onSelectMode(mode)}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
                        selectedMode === mode
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-gradient-to-r dark:from-indigo-500/30 dark:to-purple-500/30 dark:text-white'
                        : 'text-slate-500 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-gray-700'
                    }`}
                >
                    <Icon className="w-4 h-4"/>
                    {label}
                </button>
            ))}
        </div>
    );
};

const DifficultySelector: React.FC<{ selectedDifficulty: Difficulty, onSelectDifficulty: (difficulty: Difficulty) => void }> = ({ selectedDifficulty, onSelectDifficulty }) => {
    const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
    return (
        <div className="flex justify-center p-1 bg-slate-200 dark:bg-gray-950 rounded-full mt-2 animate-fade-in">
            {difficulties.map(difficulty => (
                <button
                    key={difficulty}
                    onClick={() => onSelectDifficulty(difficulty)}
                    className={`w-full px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-300 ${
                        selectedDifficulty === difficulty
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-slate-500 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-gray-800'
                    }`}
                >
                    {difficulty}
                </button>
            ))}
        </div>
    );
};


const QuizView: React.FC<{ quizData: QuizData, onAnswer: (questionIndex: number, answerIndex: number) => void, onSubmit: () => void }> = ({ quizData, onAnswer, onSubmit }) => {
    return (
        <div className="space-y-4">
            {quizData.questions.map((q, qIndex) => (
                <div key={qIndex} className="p-4 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
                    <p className="font-semibold mb-3 message-content" dangerouslySetInnerHTML={{ __html: q.questionText.replace(/\n/g, '<br />') }}/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIndex) => {
                            const isSelected = quizData.userAnswers[qIndex] === oIndex;
                            let buttonClass = 'text-left p-3 rounded-md transition-colors text-sm border ';
                            if (quizData.state === 'submitted') {
                                const isCorrect = q.correctAnswerIndex === oIndex;
                                if (isCorrect) {
                                    buttonClass += 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/30';
                                } else if (isSelected && !isCorrect) {
                                    buttonClass += 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/30';
                                } else {
                                    buttonClass += 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-gray-700 dark:text-slate-400 dark:border-gray-600 opacity-70';
                                }
                            } else {
                                buttonClass += isSelected 
                                    ? 'bg-indigo-500 text-white border-indigo-600' 
                                    : 'bg-white hover:bg-indigo-50 dark:bg-gray-700 dark:hover:bg-gray-600 border-slate-300 dark:border-gray-600';
                            }

                            return (
                                <button key={oIndex} onClick={() => onAnswer(qIndex, oIndex)} disabled={quizData.state === 'submitted'} className={buttonClass}>
                                    <span className="message-content" dangerouslySetInnerHTML={{ __html: opt.replace(/\n/g, '<br />') }}/>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            {quizData.state === 'active' && (
                <button 
                    onClick={onSubmit} 
                    disabled={quizData.userAnswers.some(a => a === null)}
                    className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:from-slate-400 disabled:to-slate-400 dark:disabled:from-gray-600 dark:disabled:to-gray-600 disabled:cursor-not-allowed"
                >
                    Submit Answers
                </button>
            )}
             {quizData.state === 'submitted' && quizData.feedback && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                    <h4 className="font-bold text-lg mb-2">Quiz Results (Score: {quizData.score}%)</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none message-content" dangerouslySetInnerHTML={{ __html: quizData.feedback.replace(/\n/g, '<br />') }}/>
                </div>
            )}
        </div>
    );
};


export const AITutor: React.FC<AITutorProps> = ({ selectedTopic, initialMode }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>(initialMode || TutorMode.LESSON);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<MathTopic | null>(null);
  
  const fetchInitialContent = async (currentTopic: MathTopic, currentMode: TutorMode, currentDifficulty: Difficulty) => {
      setChatHistory([]);
      setIsLoading(true);
      try {
          let content = '';
          if (currentMode === TutorMode.LESSON) {
              content = await generateLesson(currentTopic.name, currentDifficulty);
          } else if (currentMode === TutorMode.REVIEW) {
              content = await generateReview(currentTopic.name);
          } else if (currentMode === TutorMode.CHALLENGE) {
              content = await generateChallenge(currentTopic.name, currentDifficulty);
          } else if (currentMode === TutorMode.PRACTICE) {
              content = await generatePracticeIntro(currentTopic.name);
          }
          setChatHistory([{ role: 'model', parts: [{ text: content }] }]);
      } catch (error) {
          console.error(`Failed to generate ${currentMode}`, error);
          setChatHistory([{ role: 'model', parts: [{ text: `Sorry, I couldn't prepare the ${currentMode.toLowerCase()} right now. Please try again.` }] }]);
      } finally {
          setIsLoading(false);
      }
  };
  
  useEffect(() => {
    if (selectedTopic && (selectedTopic.name !== topicRef.current?.name || mode !== initialMode)) {
      topicRef.current = selectedTopic;
      setMode(initialMode || TutorMode.LESSON);
      setDifficulty('Medium'); // Reset difficulty on new topic
    } else if (!selectedTopic && chatHistory.length === 0) {
      setChatHistory([{ role: 'model', parts: [{ text: "Hello! To get started, please pick a subject from the 'Classes' section. I'll prepare a lesson for you instantly!" }] }]);
    }
  }, [selectedTopic, initialMode]);

  useEffect(() => {
    if (selectedTopic) {
        fetchInitialContent(selectedTopic, mode, difficulty);
    }
  }, [mode, difficulty]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);


  const sendMessage = async () => {
    if (!userInput.trim() || isLoading || !selectedTopic) return;

    const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: userInput }] };
    setChatHistory(prev => [...prev, newUserMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsLoading(true);

    try {
      // FIX: The call to getTutorResponse had 5 arguments, but the function is defined with 4. Removed the extra 'difficulty' argument.
      const modelResponse = await getTutorResponse(currentInput, chatHistory, selectedTopic.name, mode);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: modelResponse }] }]);
    } catch (error) {
      console.error("Gemini API call failed", error);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting. Please try again later." }] }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartQuiz = async () => {
    if (!selectedTopic || isLoading) return;
    setIsLoading(true);
    try {
        const quizProblems = await generateQuiz(selectedTopic.name);
        const newQuizData: QuizData = {
            questions: quizProblems,
            userAnswers: Array(quizProblems.length).fill(null),
            state: 'active',
        };
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: `Here is a short quiz on ${selectedTopic.name}. Good luck!` }], quiz: newQuizData }]);
    } catch (error) {
        console.error("Failed to generate quiz", error);
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I couldn't create a quiz right now. Please try again." }] }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnswerQuiz = (messageIndex: number, questionIndex: number, answerIndex: number) => {
    setChatHistory(prev => {
        const newHistory = [...prev];
        const quizMessage = newHistory[messageIndex];
        if (quizMessage && quizMessage.quiz) {
            const newAnswers = [...quizMessage.quiz.userAnswers];
            newAnswers[questionIndex] = answerIndex;
            quizMessage.quiz = { ...quizMessage.quiz, userAnswers: newAnswers };
        }
        return newHistory;
    });
  };

  const handleSubmitQuiz = async (messageIndex: number) => {
    setIsLoading(true);
    try {
        const quizMessage = chatHistory[messageIndex];
        if (!quizMessage || !quizMessage.quiz || !selectedTopic) return;
        
        const { questions, userAnswers } = quizMessage.quiz;
        const answersAsIndices = userAnswers.map(a => a === null ? -1 : a);
        const { score, feedback } = await gradeQuiz(selectedTopic.name, questions, answersAsIndices);
        
        // FIX: The call to recordPerformance was passing two arguments instead of a single object argument.
        recordPerformance({ topicName: selectedTopic.name, score });

        setChatHistory(prev => {
            const newHistory = [...prev];
            const updatedQuizMessage = newHistory[messageIndex];
            if (updatedQuizMessage && updatedQuizMessage.quiz) {
                updatedQuizMessage.quiz = { ...updatedQuizMessage.quiz, state: 'submitted', score, feedback };
            }
            return newHistory;
        });

    } catch (error) {
        console.error("Failed to grade quiz", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border dark:border-white/10">
      <div className="p-4 border-b border-slate-200 dark:border-white/10">
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white">AI Math Tutor</h2>
        {selectedTopic && (
            <>
                <div className="flex justify-center items-center gap-4">
                  <p className="text-sm text-center text-slate-500 dark:text-slate-400 my-2">Topic: {selectedTopic.name}</p>
                  <button onClick={handleStartQuiz} disabled={isLoading} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 transition-colors disabled:opacity-50">
                    <ClipboardCheckIcon className="w-4 h-4" />
                    Quiz Me
                  </button>
                </div>
                <ModeSelector selectedMode={mode} onSelectMode={setMode} />
                {(mode === TutorMode.LESSON || mode === TutorMode.CHALLENGE || mode === TutorMode.PRACTICE) && (
                    <DifficultySelector selectedDifficulty={difficulty} onSelectDifficulty={setDifficulty} />
                )}
            </>
        )}
      </div>
      <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <BrainCircuitIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-300" />
              </div>
            )}
            <div className={`max-w-xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-gray-800 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
              <div className="prose prose-sm dark:prose-invert max-w-none message-content" dangerouslySetInnerHTML={{ __html: msg.parts[0].text.replace(/\n/g, '<br />') }}/>
              {msg.quiz && <QuizView quizData={msg.quiz} onAnswer={(q, a) => handleAnswerQuiz(index, q, a)} onSubmit={() => handleSubmitQuiz(index)} />}
            </div>
             {msg.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-4 animate-fade-in">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                    <BrainCircuitIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-300" />
                </div>
                <div className="max-w-lg p-4 rounded-2xl bg-slate-200 dark:bg-gray-800 rounded-bl-none">
                    <LoadingIndicator />
                </div>
            </div>
        )}
        {chatHistory.length === 0 && !isLoading && !selectedTopic && (
            <div className="flex justify-center items-center h-full">
                <div className="text-center text-slate-500 dark:text-slate-400">
                    <p>Please select a topic from the 'Classes' tab to begin</p>
                </div>
            </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-gray-900/50">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedTopic ? `Ask about ${selectedTopic.name}...` : "Select a topic to start chatting"}
            disabled={isLoading || !selectedTopic}
            className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-50"
          />
          <button onClick={sendMessage} disabled={isLoading || !userInput.trim()} className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 dark:disabled:from-gray-600 dark:disabled:to-gray-600 transition-all transform hover:scale-110 disabled:scale-100">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};