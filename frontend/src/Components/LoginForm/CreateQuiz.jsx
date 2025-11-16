import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/CreateQuiz.css";
import {
  FaArrowLeft,
  FaUsers,
  FaTrophy,
  FaGamepad,
  FaClipboardList,
} from "react-icons/fa";

const CreateQuiz = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    lessonReference: "",
    description: "",
    difficulty: "easy",
    mode: "singleplayer",
    map: "house",
    classId: "", // this will be set dynamically
  });

  const token = localStorage.getItem("token"); // from login

  // ✅ Automatically set the classId from URL
  useEffect(() => {
    if (classId) {
      setFormData((prev) => ({ ...prev, classId }));
    }
  }, [classId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   try {
  //     const res = await fetch("http://localhost:5000/api/quiz/create", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(formData),
  //     });

  //     const data = await res.json();

  //     if (res.ok) {
  //       alert("✅ Quiz created successfully!");
  //       navigate(`/create-quiz/${classId}/multiple-choice`);
  //     } else {
  //       alert(`❌ Error: ${data.message}`);
  //     }
  //   } catch (error) {
  //     console.error("Error creating quiz:", error);
  //     alert("Something went wrong!");
  //   }
  // };

  return (
    <div className="leaderboard-container">
      {/* Sidebar */}
      <div className="sidebar10">
        <button className="back-btn" onClick={() => navigate("my-class-teacher")}>
          <FaArrowLeft /> BACK
        </button>

        <div className="profile-section">
          <img src="/Assets/avatar.png" alt="avatar" className="avatar-image" />
          <h2>Mr. John</h2>
          <p className="role">TEACHER</p>
        </div>

        <div className="menu">
          <div
            className="menu-item"
            onClick={() => navigate(`/view-students/${classId}`)}
          >
            <FaUsers /> VIEW STUDENTS
          </div>
          <div
            className="menu-item"
            onClick={() => navigate(`/leaderboards/${classId}`)}
          >
            <FaTrophy /> LEADERBOARDS
          </div>
          <div
            className="menu-item active"
            onClick={() => navigate(`/select-gamemode/${classId}`)}
          >
            <FaGamepad /> CREATE QUIZ
          </div>
          <div className="menu-item" onClick={() => navigate(`/my-quizzes/${classId}`)}>
            <FaClipboardList /> MY QUIZZES
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="create-quiz-container">
        <h2>Create Quiz</h2>

        <form className="create-quiz-form">
          <label>Quiz Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label>Lesson Reference:</label>
          <input
            type="text"
            name="lessonReference"
            value={formData.lessonReference}
            onChange={handleChange}
            required
          />

          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          <button type="submit" onClick={() =>{navigate("create-questions")}}>Next</button>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;
