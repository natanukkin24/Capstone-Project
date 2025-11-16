import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaChalkboardTeacher, FaUser, FaBook, FaGraduationCap, FaCode } from "react-icons/fa";
import "../../styles/Classroom.css";
import SidebarStudent from "./SidebarStudent";

const ViewClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassroomDetails = async () => {
      if (!classId) {
        setError("No classroom ID provided.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("ViewClass - API Response:", response.data);

        // Handle both response formats (singular 'classroom' or plural 'classrooms')
        const classroomData = response.data.classroom || response.data.classrooms;
        const teacherData = response.data.teacher || (classroomData?.teacher ? {
          firstname: classroomData.teacher.firstname,
          lastname: classroomData.teacher.lastname,
          avatar: classroomData.teacher.avatar
        } : null);

        setClassroomDetails({
          classroom: classroomData,
          teacher: teacherData,
        });
        setError(null);
      } catch (error) {
        console.error("Error fetching classroom details:", error);
        setError("Failed to load classroom details. Please try again.");
        if (error.response?.status === 401) {
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomDetails();
  }, [classId, navigate]);

  if (loading) {
    return (
      <div className="classroom-page">
        <SidebarStudent />
        <div className="classroom-content">
          <div className="loading-container">
            <p>Loading classroom details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !classroomDetails) {
    return (
      <div className="classroom-page">
        <SidebarStudent />
        <div className="classroom-content">
          <div className="error-container">
            <p>{error || "Classroom not found."}</p>
            <button onClick={() => navigate("/my-class")} className="back-button">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="classroom-page">
      <SidebarStudent />

      <div className="classroom-content">
        <div className="classroom-header">
          <h1>
            <FaChalkboardTeacher /> CLASSROOM INFORMATION
          </h1>
        </div>

        <div className="classroom-card">
          <div className="classroom-info-section">
            <div className="info-item">
              <div className="info-icon">
                <FaUser />
              </div>
              <div className="info-content">
                <span className="info-label">TEACHER</span>
                <span className="info-value">
                  {classroomDetails.teacher?.firstname} {classroomDetails.teacher?.lastname}
                </span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <FaBook />
              </div>
              <div className="info-content">
                <span className="info-label">SUBJECT</span>
                <span className="info-value">{classroomDetails.classroom?.subject || "N/A"}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <FaGraduationCap />
              </div>
              <div className="info-content">
                <span className="info-label">GRADE LEVEL</span>
                <span className="info-value">{classroomDetails.classroom?.gradeLevel || "N/A"}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <FaChalkboardTeacher />
              </div>
              <div className="info-content">
                <span className="info-label">SECTION</span>
                <span className="info-value">{classroomDetails.classroom?.section || "N/A"}</span>
              </div>
            </div>

            <div className="info-item class-code-item">
              <div className="info-icon">
                <FaCode />
              </div>
              <div className="info-content">
                <span className="info-label">CLASSROOM CODE</span>
                <span className="info-value class-code">
                  {classroomDetails.classroom?.classCode || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClass;
