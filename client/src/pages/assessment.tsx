import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [, navigate] = useLocation();

  // Mock assessment questions - in production these would come from the database
  const assessmentQuestions = [
    {
      id: 1,
      questionType: "vocabulary",
      difficulty: 1,
      question: "What does '你好' (nǐ hǎo) mean?",
      options: ["Hello", "Goodbye", "Thank you", "Sorry"],
      correctAnswer: "Hello",
      points: 10
    },
    {
      id: 2,
      questionType: "vocabulary",
      difficulty: 1,
      question: "How do you say 'Thank you' in Chinese?",
      options: ["再见", "谢谢", "对不起", "你好"],
      correctAnswer: "谢谢",
      points: 10
    },
    {
      id: 3,
      questionType: "grammar",
      difficulty: 2,
      question: "Which measure word is used for books?",
      options: ["个", "本", "只", "张"],
      correctAnswer: "本",
      points: 15
    },
    {
      id: 4,
      questionType: "vocabulary",
      difficulty: 2,
      question: "What does '学习' (xué xí) mean?",
      options: ["To eat", "To sleep", "To study", "To work"],
      correctAnswer: "To study",
      points: 15
    },
    {
      id: 5,
      questionType: "reading",
      difficulty: 3,
      question: "Complete the sentence: 我___中国人。(I am Chinese)",
      options: ["是", "有", "在", "去"],
      correctAnswer: "是",
      points: 20
    },
    {
      id: 6,
      questionType: "vocabulary",
      difficulty: 3,
      question: "What is the pinyin for '朋友'?",
      options: ["péng yǒu", "míng zi", "lǎo shī", "xué shēng"],
      correctAnswer: "péng yǒu",
      points: 20
    },
    {
      id: 7,
      questionType: "grammar",
      difficulty: 4,
      question: "Which sentence structure is correct for 'I want to go to China'?",
      options: [
        "我想去中国",
        "我去想中国",
        "中国我想去",
        "想我去中国"
      ],
      correctAnswer: "我想去中国",
      points: 25
    },
    {
      id: 8,
      questionType: "reading",
      difficulty: 4,
      question: "What does '我每天早上喝咖啡' mean?",
      options: [
        "I drink coffee every morning",
        "I eat breakfast every day",
        "I go to work in the morning",
        "I like coffee very much"
      ],
      correctAnswer: "I drink coffee every morning",
      points: 25
    },
    {
      id: 9,
      questionType: "vocabulary",
      difficulty: 5,
      question: "Which character means 'computer'?",
      options: ["电脑", "电话", "电视", "电影"],
      correctAnswer: "电脑",
      points: 30
    },
    {
      id: 10,
      questionType: "grammar",
      difficulty: 5,
      question: "How do you express 'have been to' in Chinese?",
      options: ["去过", "来过", "到过", "走过"],
      correctAnswer: "去过",
      points: 30
    }
  ];

  const submitAssessmentMutation = useMutation({
    mutationFn: async () => {
      const correctAnswers = assessmentQuestions.filter(
        (q, index) => answers[index] === q.correctAnswer
      ).length;
      
      const totalScore = assessmentQuestions.reduce((sum, q, index) => {
        return sum + (answers[index] === q.correctAnswer ? q.points : 0);
      }, 0);
      
      const maxScore = assessmentQuestions.reduce((sum, q) => sum + q.points, 0);
      const percentage = (totalScore / maxScore) * 100;
      
      // Determine recommended level based on score
      let recommendedLevel = 1;
      if (percentage >= 90) recommendedLevel = 5;
      else if (percentage >= 75) recommendedLevel = 4;
      else if (percentage >= 60) recommendedLevel = 3;
      else if (percentage >= 40) recommendedLevel = 2;
      
      const result = {
        userId: "demo-user", // In production, get from auth
        score: totalScore,
        totalQuestions: assessmentQuestions.length,
        correctAnswers,
        recommendedLevel,
        strengths: correctAnswers > 5 ? ["vocabulary"] : [],
        weaknesses: correctAnswers <= 5 ? ["vocabulary", "grammar"] : []
      };
      
      // Save assessment result and update user profile
      await apiRequest("POST", "/api/assessment/complete", result);
      
      return result;
    },
    onSuccess: (data) => {
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    }
  });

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitAssessmentMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const question = assessmentQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;

  if (showResults && submitAssessmentMutation.data) {
    const result = submitAssessmentMutation.data;
    const percentage = (result.score / assessmentQuestions.reduce((sum, q) => sum + q.points, 0)) * 100;
    
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-duo text-center">
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl text-white font-bold">{Math.round(percentage)}%</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Assessment Complete!</h2>
            <p className="text-xl font-medium text-gray-700 mb-2">
              You got {result.correctAnswers} out of {result.totalQuestions} questions correct
            </p>
            <p className="text-lg text-brand-primary font-semibold">
              Recommended Level: {result.recommendedLevel}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-800 mb-3">Your Strengths</h3>
              {result.strengths.length > 0 ? (
                <ul className="text-green-700">
                  {result.strengths.map((strength, i) => (
                    <li key={i} className="flex items-center mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      {strength.charAt(0).toUpperCase() + strength.slice(1)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-700">Keep practicing to identify your strengths!</p>
              )}
            </div>

            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-orange-800 mb-3">Areas to Improve</h3>
              {result.weaknesses.length > 0 ? (
                <ul className="text-orange-700">
                  {result.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-center mb-2">
                      <i className="fas fa-arrow-up mr-2"></i>
                      {weakness.charAt(0).toUpperCase() + weakness.slice(1)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-orange-700">Great job! Continue challenging yourself!</p>
              )}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => navigate("/")}
              className="btn-primary"
            >
              Start Learning
            </button>
            <button 
              onClick={() => {
                setCurrentQuestion(0);
                setAnswers({});
                setShowResults(false);
              }}
              className="btn-outline"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Chinese Level Assessment</h2>
        <p className="text-gray-700 font-medium">
          Answer these questions to determine your current Chinese proficiency level
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
          <span>Question {currentQuestion + 1} of {assessmentQuestions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-brand-primary to-brand-primary-light h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="card-duo mb-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-primary text-white">
              {question.questionType.charAt(0).toUpperCase() + question.questionType.slice(1)}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {question.points} points
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{question.question}</h3>
        </div>

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                answers[currentQuestion] === option
                  ? "border-brand-primary bg-brand-primary bg-opacity-10"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                  answers[currentQuestion] === option
                    ? "border-brand-primary bg-brand-primary"
                    : "border-gray-300"
                }`}>
                  {answers[currentQuestion] === option && (
                    <i className="fas fa-check text-white text-xs"></i>
                  )}
                </div>
                <span className="text-lg">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          variant="outline"
          className="px-6"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion]}
          className="btn-primary px-6"
        >
          {currentQuestion === assessmentQuestions.length - 1 ? (
            <>
              Submit Assessment
              <i className="fas fa-check ml-2"></i>
            </>
          ) : (
            <>
              Next
              <i className="fas fa-arrow-right ml-2"></i>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}