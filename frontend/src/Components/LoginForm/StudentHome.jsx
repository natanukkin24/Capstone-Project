import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaDoorOpen,
  FaChalkboardTeacher,
  FaShoppingCart,
} from "react-icons/fa";
import axios from "axios";
import "../../styles/StudentHome.css";

const StudentHome = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("");

  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && res.data.accountType) {
          setAccountType(res.data.accountType.toUpperCase());
        }
      } catch (error) {
        console.error("Error fetching account type:", error);
      }
    };

    fetchAccountType();
  }, []);

  const handleProfileClick = () => {
    navigate("/set-profile");
  };
  const handleJoinClassClick = () => {
    navigate("/join-class");
  };
  const handleMyClassClick = () => {
    navigate("/my-class");
  };
  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/"; // full reload to reset app state
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <div className="student-home-container">
      <header className="student-home-header">
        <div className="header-left">
          <span className="account-type-label">{accountType}</span>
        </div>
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

      <main className="student-home-main">
        <div className="home-box1" onClick={handleJoinClassClick}>
          <FaDoorOpen
            className="svghome-icon"
            size={80}
            style={{ stroke: "black", strokeWidth: 10 }}
          />
          <span>JOIN CLASS</span>
        </div>
        <div className="home-box2" onClick={handleMyClassClick}>
          <FaChalkboardTeacher
            className="svghome-icon"
            size={80}
            style={{ stroke: "black", strokeWidth: 10 }}
          />
          <span>MY CLASS</span>
        </div>
      </main>
    </div>
  );
};
export default StudentHome;
