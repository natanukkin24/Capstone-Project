import React from "react";
import "../../styles/GameMode.css";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaUsers,
  FaTrophy,
  FaGamepad,
  FaClipboardList,
} from "react-icons/fa";

const GameMode = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  return (
    <div className="game-mode-container">
          {/* Sidebar */}
          <div className="leaderboard-container">
            {/* Sidebar */}
            <div className="sidebar10">
              <button className="back-btn" onClick={() => navigate("/my-class-teacher")}>
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
                <div className="menu-item"
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
          </div>


      {/* Main Content */}
      <main className="main-area">
        <div className="overlay">
          <h1 className="title">SELECT GAME MODE</h1>
          <div className="buttons">
            <button className="mode-btn single" onClick={() => navigate(`/create-quiz/${classId}`)}>
              <span>Single Player</span>
            </button>

            <button className="mode-btn multi" onClick={() => navigate(`/create-quiz/${classId}`)}>
              ⚔️ <span>Multiplayer</span>
            </button>

          </div>
        </div>
      </main>
    </div>
  );
};

export default GameMode;
