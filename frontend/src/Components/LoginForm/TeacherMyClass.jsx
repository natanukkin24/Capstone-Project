import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  // FaArrowRight,
  FaTimes,
} from "react-icons/fa";
import axios from "axios";
import "../../styles/TeacherMyClass.css";

const MyClass = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleClose = () => {
    navigate("/teacher-home");
  };

  const handleNext = (classId) => {
    // Navigate to classroom page
    navigate(`/classroom/${classId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleProfileClick = () => {
    navigate("/set-profile");
  };

  // 🔹 Fetch teacher's created classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/classes/my-classes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setClasses(res.data);
      } catch (err) {
        console.error("Error fetching classes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [navigate]);

  return (
    <div className="student-home-container">
      <header className="student-home-header">
        <div className="header-icons">
          <div className="header-box1" onClick={handleProfileClick}>
            <FaUserCircle className="icon" />
            <span>PROFILE</span>
          </div>
          <div
            className="header-box2"
            onClick={() => navigate("/settings")}
            style={{ cursor: "pointer" }}
          >
            <FaCog className="icon" />
            <span>SETTINGS</span>
          </div>
          <div
            className="header-box3"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
          >
            <FaSignOutAlt className="icon" />
            <span>LOGOUT</span>
          </div>
        </div>
      </header>

      <div className="student-home-container">
        <div className="container">
          <div className="class-box">
            <FaTimes className="close-icon" onClick={handleClose} />
            <div className="class-header">
              <h1>MY CLASS</h1>
            </div>

            {loading ? (
              <p>Loading classes...</p>
            ) : classes.length === 0 ? (
              <p>You haven’t created any classes yet.</p>
            ) : (
              <div className="class-list">
            {classes.map((cls, index) => (
              <div
                key={cls._id}
                className={`class-card ${index % 2 === 0 ? "yellow-card" : "brown-card"}`}
              >
                <div className="class-info">
                  <p><strong>GRADE LEVEL:</strong> {cls.gradeLevel}</p>
                  <p><strong>SECTION:</strong> {cls.section}</p>
                  <p><strong>SUBJECT:</strong> {cls.subject}</p>
                  <p><strong>TEACHER:</strong> John Doe</p>
                </div>
                <div className="class-actions">
                  <p className="class-code-label">CLASS CODE</p>
                  <p className="class-code">{cls.classCode}</p> {/* ✅ display code from DB */}
                  <button className="enter-room-btn" onClick={() => handleNext(cls._id)}>
                    ENTER ROOM
                  </button>
                </div>
              </div>
            ))}

          </div>

                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
};

export default MyClass;
  