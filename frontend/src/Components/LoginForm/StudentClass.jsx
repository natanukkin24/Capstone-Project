import React, { useState, useEffect } from "react";
import {
  FaGamepad,
  FaUser,
  FaTrophy,
  FaSignOutAlt,
  FaBell,
} from "react-icons/fa";
import "../../styles/StudentClass.css";
import { useNavigate, useParams, useLocation } from "react-router-dom"; // ✅ added useLocation

const StudentClass = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const location = useLocation(); // ✅ fixed this

  const [spin, setSpin] = useState(false);
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    setSpin(true);
    const timer = setTimeout(() => setSpin(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem("token"); // ✅ make sure your login stores this
      const res = await fetch(`http://localhost:5000/api/classes/${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch class data");
      const data = await res.json();
      setClassData(data);
    } catch (err) {
      console.error("Error loading class:", err);
    }
  };

  if (classId) fetchClassData();
    }, [classId]);


  return (
    <div className="student-class-container">
      <div className="notification">
        <FaBell className="notification-icon" />
      </div>

      <aside className="sidebar8">
        <button className="leave-button" onClick={() => navigate("/my-class")}>
          <FaSignOutAlt /> LEAVE
        </button>

        <div className="profile-section">
          <img
            src="/Assets/avatar.png"
            alt="Avatar"
            className={`avatar ${spin ? "spin" : ""}`}
          />
          <h1 className="username">InsertDelete.</h1>
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

        {/* ✅ Use location.pathname safely now */}
        <nav className="menu">
          <button
            onClick={() => navigate(`/view-class/${classId}`)}
            className={location.pathname === "/join-game" ? "active" : ""}
          >
            <FaGamepad /> CLASS
          </button>
          <button
            onClick={() => navigate("/join-game")}
            className={location.pathname === "/join-game" ? "active" : ""}
          >
            <FaGamepad /> JOIN GAME
          </button>
          <button
            onClick={() => navigate("/set-profile")}
            className={location.pathname === "/set-profile" ? "active" : ""}
          >
            <FaUser /> PROFILE
          </button>
          <button
            onClick={() => navigate(`/view-class/${classId}/leaderboards`)}
            className={location.pathname === "/leaderboards" ? "active" : ""}
          >
            <FaTrophy /> LEADERBOARDS
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {classData ? (
          <div className="class-header">
            <h2>{classData.classroom.subject}</h2>
            <p>
              {classData.classroom.gradeLevel} - Section {classData.section}
            </p>
            <p>Class Code: {classData.classroom.classCode}</p>
          </div>
        ) : (
          <p style={{ color: "#fff" }}>Loading class info...</p>
        )}

        <div className="progress">
          <div className="progress-box">
            <p>QUIZZES COMPLETED</p>
            <span>0/10</span>
          </div>
          <div className="progress-box">
            <p>ACHIEVEMENTS UNLOCKED</p>
            <span>0/25</span>
          </div>
        </div>

        <div className="badges-section">
          <h3>BADGES</h3>
          <div className="badges">
            <div className="badge blue">
              XP COLLECTOR
              <img src="/Assets/diamond.png" alt="Diamond" className="diamond" />
            </div>
            <div className="badge orange">
              MASTERMIND
              <img src="/Assets/star.png" alt="Star" className="star" />
            </div>
            <div className="badge yellow">
              QUICK THINKER
              <img src="/Assets/thunder.png" alt="Thunder" className="thunder" />
            </div>
            <div className="badge brown">
              QUIZ CHAMPION
              <img src="/Assets/Trophy.png" alt="Trophy" className="Trophy" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentClass;
