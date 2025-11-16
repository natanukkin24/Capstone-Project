import React from "react";
import "../../styles/Leaderboards.css"; // reuse same style for sidebar
import { FaTrophy, FaSignOutAlt, FaGamepad, FaUser } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

const StudentClassroom = () => {
  const navigate = useNavigate();
  const { classId } = useParams();

  return (
    <div className="leaderboard-page">
      {/* ✅ SIDEBAR */}
      <aside className="sidebar1">
        <button
          className="leave-button"
          onClick={() => navigate("/student-home")}
        >
          <FaSignOutAlt /> LEAVE
        </button>

        <div className="profile-info">
          <img src="/Assets/avatar.png" alt="avatar" className="avatar-image" />
          <h1
            className="username"
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#ffffff",
              margin: 0,
            }}
          >
            InsertDelete.
          </h1>
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              color: "#FFFFFF ",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            STUDENT
          </span>
        </div>

        {/* ✅ Navigation */}
        <nav className="menu">
          <button className="active">
            <FaGamepad /> CLASS
          </button>
          <button onClick={() => navigate(`/join-game/${classId}`)}>
            <FaGamepad /> JOIN GAME
          </button>
          <button disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
            <FaUser /> PROFILE
          </button>
          <button onClick={() => navigate(`/view-class/${classId}/leaderboards`)}>
            <FaTrophy /> LEADERBOARDS
          </button>
        </nav>
      </aside>

      {/* ✅ MAIN CONTENT AREA */}
      <main
        className="leaderboard-content"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", color: "#f9a602" }}>
          Welcome to Your Class!
        </h1>

        
      </main>
    </div>
  );
};

export default StudentClassroom;
