import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/Classroom.css";
import Sidebar from "./Sidebar";
import { FaChalkboardTeacher, FaUser, FaBook, FaGraduationCap, FaCode, FaTrash } from "react-icons/fa";

const Classroom = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classroomDetails, setClassroomDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

        setClassroomDetails({
          classroom: response.data.classroom || response.data.classrooms,
          teacher: response.data.teacher,
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

  const handleDeleteClassroom = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteClassroom = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`http://localhost:5000/api/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 204) {
        alert("Classroom deleted successfully.");
        setShowDeleteModal(false);
        navigate("/my-class-teacher");
      }
    } catch (error) {
      console.error("Error deleting classroom:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete classroom. Please try again.";
      alert(errorMessage);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="classroom-page">
        <Sidebar />
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
        <Sidebar />
        <div className="classroom-content">
          <div className="error-container">
            <p>{error || "Classroom not found."}</p>
            <button onClick={() => navigate("/my-class-teacher")} className="back-button">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="classroom-page">
      <Sidebar />

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

          <div className="classroom-actions">
            <button className="delete-classroom-btn" onClick={handleDeleteClassroom}>
              <FaTrash /> DELETE CLASSROOM
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title delete-title">DELETE CLASSROOM</h2>
            <div className="delete-warning">
              <p>⚠️ Are you sure you want to delete this classroom?</p>
              <p className="warning-text">
                This action cannot be undone. All quizzes, students, and data associated with this
                classroom will be permanently deleted.
              </p>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                CANCEL
              </button>
              <button className="btn-delete" onClick={confirmDeleteClassroom}>
                <FaTrash /> DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classroom;



