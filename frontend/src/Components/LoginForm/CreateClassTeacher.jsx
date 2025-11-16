import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaCog, FaSignOutAlt } from "react-icons/fa";
import axios from "axios";
import "../../styles/Teacher.css";

const CreateClassTeacher = () => {
  const navigate = useNavigate();

  // 🧠 State to store form input values
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧩 Handlers for top bar buttons
  const handleProfileClick = () => navigate("/set-profile");
  const handleSettingsClick = () => navigate("/settings");
  const handleLogout = () => navigate("/");

  // 💾 Function to send class data to backend
  const handleCreateClass = async () => {
    if (!gradeLevel || !section || !subject) {
      alert("Please fill out all fields before creating a class.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired. Please log in again.");
        navigate("/");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/classes",
        {
          gradeLevel,
          section,
          subject,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Class created successfully!");
      console.log("Created class:", res.data);
      navigate("/my-class-teacher"); // go to class list page
    } catch (err) {
      console.error("Error creating class:", err);
      alert(err.response?.data?.message || "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-home-container">
      <header className="student-home-header">
        <div className="header-left"></div>
        <div className="header-icons">
          <div
            className="header-box1"
            onClick={handleProfileClick}
            style={{ cursor: "pointer" }}
          >
            <FaUserCircle className="icon" />
            <span>PROFILE</span>
          </div>
          <div
            className="header-box2"
            onClick={handleSettingsClick}
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

      <div className="containers">
        <h1 className="title">CREATE CLASS</h1>

        <div className="form-group">
          <label htmlFor="gradeLevel" className="label">
            GRADE LEVEL
          </label>
          <select
            id="gradeLevel"
            className="input"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            required
          >
            <option value="">Select Grade Level</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subject" className="label">
            SUBJECT
          </label>
          <select
            id="subject"
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          >
            <option value="">Select Subject</option>
            <option value="Filipino">Filipino</option>
            <option value="English">English</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Araling Panlipunan (Social Studies)">Araling Panlipunan (Social Studies)</option>
            <option value="MAPEH">MAPEH</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="section" className="label">
            SECTION
          </label>
          <input
            type="text"
            id="section"
            className="input"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
        </div>

        <div className="buttons">
          <button
            className="btn create-btn"
            onClick={handleCreateClass}
            disabled={loading}
          >
            {loading ? "Creating..." : "CREATE CLASS"}
          </button>

          <button
            className="btn cancel-btn"
            onClick={() => navigate("/teacher-home")}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateClassTeacher;
