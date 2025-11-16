// src/components/CreateQuiz/TrueFalse.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../../styles/QuestionTypes.css";
import Sidebar from "../Sidebar";

const TrueFalse = () => {
  const navigate = useNavigate();
  const { classId } = useParams();

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    if (selectedType === "multiple-choice") navigate(`/create-quiz/${classId}/multiple-choice`);
    else if (selectedType === "true-false") navigate(`/create-quiz/${classId}/true-or-false`);
    else if (selectedType === "fill-blank") navigate(`/create-quiz/${classId}/fill-in-the-blank`);
  };

  return (
    <div className="leaderboard-container">
      <Sidebar />
      <div className="question-main">
        <div className="question-header">
          <h2>Create Question</h2>
          <select className="type-dropdown" onChange={handleTypeChange} defaultValue="true-false">
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True or False</option>
            <option value="fill-blank">Fill in the Blank</option>
          </select>
        </div>

        <div className="question-box">
          <h3>Question</h3>
          <input type="text" placeholder="Enter your question..." />

          <h3>Answer</h3>
          <div className="answers">
            <label><input type="radio" name="answer" /> True</label>
            <label><input type="radio" name="answer" /> False</label>
          </div>

          <button className="done-btn">Done</button>
        </div>
      </div>
    </div>
  );
};

export default TrueFalse;
