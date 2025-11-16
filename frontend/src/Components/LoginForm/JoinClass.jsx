import React, { useState } from "react";
import {
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/JoinClass.css";

const JoinClass = () => {
  const [classCode, setClassCode] = useState("");
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!classCode.trim()) {
      setIsValid(false);
      setMessage("Please enter a class code.");
      return;
    }

    try {
      const token = localStorage.getItem("token"); // ✅ Get student token
      const res = await axios.post(
        "http://localhost:5000/api/classes/enroll",
        { classCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsValid(true);
      setMessage(res.data.message || "Successfully joined class!");

      // ✅ Redirect after a short delay
      setTimeout(() => {
        navigate("/my-class");
      }, 1500);
    } catch (err) {
      setIsValid(false);
      setMessage(
        err.response?.data?.message ||
          "Error joining class. Please try again."
      );
    }
  };

  const handleInputChange = (e) => {
    setClassCode(e.target.value);
    setIsValid(null);
    setMessage("");
  };

  const handleCancel = () => {
    navigate("/student-home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="student-home-container">
      <header className="student-home-header">
        <div className="header-icons">
          <div className="header-box1">
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

      <div className="container">
        <h1 className="class-heading">
          <svg
            className="heading-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3 2v20h18V2h-7V0h9v24H1V0h9zM16 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
          <span>ENTER A CLASS CODE</span>
        </h1>

        <div className="input-wrapper">
          <input
            type="text"
            className={`input-field ${isValid === false ? "invalid" : ""}`}
            value={classCode}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. A1B2C3D4"
          />
          {isValid === true && <FaCheckCircle className="valid-icon" />}
          {isValid === false && <FaTimesCircle className="invalid-icon" />}
        </div>

        <div className="button-container">
          <button className="button submit-button" onClick={handleSubmit}>
            SUBMIT
          </button>
          <button className="button cancel-button" onClick={handleCancel}>
            CANCEL
          </button>
        </div>

        {message && (
          <p className={`status-text ${isValid ? "success" : "error"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default JoinClass;
