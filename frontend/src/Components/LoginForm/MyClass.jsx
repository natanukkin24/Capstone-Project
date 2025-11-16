import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaArrowRight,
  FaTimes,
} from "react-icons/fa";
import axios from "axios";
import "../../styles/MyClass.css";

const MyClass = () => {
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/classes/my-classes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyClasses(res.data.classrooms || []);

      } catch (error) {
        if (error.response && error.response.status === 404) {
          setMyClasses([]); // No classes joined
        } else {
          console.error("Error fetching classes:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyClasses();
  }, []);

  const handleClose = () => navigate("/student-home");
  const handleLogout = () => navigate("/");
  const handleProfileClick = () => navigate("/set-profile");
  const handleEnterClass = (classId) => navigate(`/view-class/${classId}`);

  return (
    <div className="student-home-container">
      <header className="student-home-header">
        <div className="header-icons">
          <div className="header-box1" onClick={handleProfileClick}>
            <FaUserCircle className="icon" />
            <span>PROFILE</span>
          </div>
          <div className="header-box2" onClick={() => navigate("/settings")}>
            <FaCog className="icon" />
            <span>SETTINGS</span>
          </div>
          <div className="header-box3" onClick={handleLogout}>
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
              <h1>MY CLASSES</h1>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : myClasses.length > 0 ? (
              <div className="classes-list">
                {myClasses.map((classItem) => (
                  <div key={classItem._id} className="class-details">
                    <h2>{classItem.subject}</h2>
                    <p>
                      <strong>Grade Level:</strong> {classItem.gradeLevel}
                    </p>
                    <p>
                      <strong>Section:</strong> {classItem.section}
                    </p>
                    <p>
                      <strong>Teacher:</strong>{" "}
                      {classItem.teacher?.firstname} {classItem.teacher?.lastname}
                    </p>
                    <p>
                      <strong>Class Code:</strong> {classItem.classCode}
                    </p>
                    <div
                      className="next-icon"
                      onClick={() => handleEnterClass(classItem._id)}
                      style={{ cursor: "pointer" }}
                    >
                      <FaArrowRight />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>JOIN CLASS TO GET STARTED</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClass;
