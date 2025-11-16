import React, { useState } from "react";
import axios from "axios";
import "../../../styles/QuestionTypes.css";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../Sidebar";

const QuizQuestions = () => {
  const navigate = useNavigate();
  const { classId } = useParams(); // from URL like /create-quiz/:classId
  const [quizInfo, setQuizInfo] = useState({
    title: "",
    lessonReference: "",
    description: "",
    difficulty: "medium",
    mode: "singleplayer",
  });

  const [questions, setQuestions] = useState([
    { questionType: "multiple_choice", questionText: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // handle input for quiz info
  const handleQuizInfoChange = (e) => {
    const { name, value } = e.target;
    setQuizInfo((prev) => ({ ...prev, [name]: value }));
  };

  // handle question field changes
  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleQuestionTypeChange = (index, newType) => {
    const updated = [...questions];
    updated[index].questionType = newType;

    // Reset structure depending on question type
    if (newType === "multiple_choice") {
      updated[index].options = ["", "", "", ""];
      updated[index].correctAnswer = "";
    } else {
      updated[index].options = [];
      updated[index].correctAnswer = "";
    }
    setQuestions(updated);
  };

  const addQuestion = () => {
    if (questions.length < 10) {
      setQuestions([
        ...questions,
        { questionType: "multiple_choice", questionText: "", options: ["", "", "", ""], correctAnswer: "" },
      ]);
    }
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token"); // JWT from login
      const response = await axios.post(
        "http://localhost:5000/api/quiz/create",
        { ...quizInfo, questions, classId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Quiz created successfully!");
      console.log("Created Quiz:", response.data.quiz);

      // Redirect to map selection
      setTimeout(() => navigate(`/select-map/${classId}/${response.data.quiz._id}`), 1500);
    } catch (error) {
      console.error("Error creating quiz:", error);
      const errorMessage = error.response?.data?.message || "Failed to create quiz. Please try again.";
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quiz-question-container">
      <Sidebar />
      <h2>Create a New Quiz</h2>

      {/* Quiz Info Section */}
      <section className="quiz-info">
        <input
          type="text"
          name="title"
          placeholder="Quiz Title"
          value={quizInfo.title}
          onChange={handleQuizInfoChange}
        />
        <input
          type="text"
          name="lessonReference"
          placeholder="Lesson Reference"
          value={quizInfo.lessonReference}
          onChange={handleQuizInfoChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={quizInfo.description}
          onChange={handleQuizInfoChange}
        ></textarea>

        <div className="quiz-options">
          <select name="difficulty" value={quizInfo.difficulty} onChange={handleQuizInfoChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select name="mode" value={quizInfo.mode} onChange={handleQuizInfoChange}>
            <option value="singleplayer">Single Player</option>
            <option value="multiplayer">Multiplayer</option>
          </select>
        </div>
      </section>

      {/* Questions Section */}
      <section className="questions-section">
        {questions.map((q, index) => (
          <div key={index} className="question-item">
            <div className="question-header">
              <h4>Question {index + 1}</h4>
              <button type="button" onClick={() => removeQuestion(index)}>
                ❌
              </button>
            </div>

            <select
              value={q.questionType}
              onChange={(e) => handleQuestionTypeChange(index, e.target.value)}
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="fill_in_the_blank">Fill in the Blank</option>
            </select>

            <textarea
              placeholder="Enter question text"
              value={q.questionText}
              onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)}
            ></textarea>

            {q.questionType === "multiple_choice" && (
              <div className="mcq-options">
                {q.options.map((opt, optIndex) => (
                  <input
                    key={optIndex}
                    type="text"
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                  />
                ))}
              </div>
            )}

            {q.questionType === "true_false" ? (
              <select
                value={q.correctAnswer}
                onChange={(e) => handleQuestionChange(index, "correctAnswer", e.target.value)}
                style={{ padding: "10px", fontSize: "16px", width: "100%", marginTop: "10px" }}
              >
                <option value="">Select Correct Answer</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            ) : (
              <input
                type="text"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={(e) => handleQuestionChange(index, "correctAnswer", e.target.value)}
              />
            )}
          </div>
        ))}

        <button type="button" onClick={addQuestion} disabled={questions.length >= 10}>
          ➕ Add Question
        </button>
      </section>

      {/* Submit */}
      <button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Quiz"}
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default QuizQuestions;
