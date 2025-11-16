import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaTimes } from "react-icons/fa";
import "../../styles/MyQuizzes.css";
import Sidebar from "./Sidebar"

const MyQuizzes = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, quiz: null });

  // Format date to "MMM. DD, YYYY" format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}. ${day}, ${year}`;
  };

  // Capitalize first letter of difficulty
  const formatDifficulty = (difficulty) => {
    if (!difficulty) return "N/A";
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get("http://localhost:5000/api/quiz/my-quizzes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Ensure response.data is an array
        setQuizzes(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setError("Failed to load quizzes. Please try again.");
        if (error.response?.status === 401) {
          navigate("/");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [navigate]);

  const handleDeleteClick = (e, quiz) => {
    e.stopPropagation(); // Prevent row click when clicking delete button
    setDeleteModal({ show: true, quiz });
  };

  const confirmDeleteQuiz = async () => {
    if (!deleteModal.quiz) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to delete a quiz.");
        setDeleteModal({ show: false, quiz: null });
        return;
      }

      const response = await axios.delete(
        `http://localhost:5000/api/quiz/${deleteModal.quiz._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setQuizzes(quizzes.filter((q) => q._id !== deleteModal.quiz._id));
        setDeleteModal({ show: false, quiz: null });
        alert("Quiz deleted successfully.");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete quiz. Please try again.";
      alert(errorMessage);
      setDeleteModal({ show: false, quiz: null });
    }
  };


  return (
    <div className="leaderboard-container">
      <Sidebar />

      <div className="main-content2">
        <div className="m">
          <h4>MY QUIZZES</h4>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Loading quizzes...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                padding: "10px 20px", 
                background: "#007bff", 
                color: "white", 
                border: "none", 
                borderRadius: "8px", 
                cursor: "pointer" 
              }}
            >
              Retry
            </button>
          </div>
        ) : quizzes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>You haven't created any quizzes yet.</p>
            <button 
              onClick={() => navigate("/my-class-teacher")}
              style={{ 
                marginTop: "1rem", 
                padding: "10px 20px", 
                background: "#007bff", 
                color: "white", 
                border: "none", 
                borderRadius: "8px", 
                cursor: "pointer" 
              }}
            >
              Create Your First Quiz
            </button>
          </div>
        ) : (
          <div className="quiz-table">
            <div className="quiz-header">
              <span>QUIZ NAME</span>
              <span>SUBJECT</span>
              <span>DIFFICULTY</span>
              <span>DATE</span>
              <span>ACTIONS</span>
            </div>

            {quizzes.map((quiz) => (
              <div 
                className="quiz-row clickable" 
                key={quiz._id}
                onClick={() => navigate(`/lobby/${quiz._id}`)}
                style={{ cursor: "pointer" }}
              >
                <span>{quiz.title || "Untitled Quiz"}</span>
                <span>{quiz.classId?.subject || "N/A"}</span>
                <span>{formatDifficulty(quiz.difficulty)}</span>
                <span>{formatDate(quiz.createdAt)}</span>
                <span className="quiz-actions">
                  <button
                    className="delete-quiz-btn"
                    onClick={(e) => handleDeleteClick(e, quiz)}
                    title="Delete Quiz"
                  >
                    <FaTrash />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, quiz: null })}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDeleteModal({ show: false, quiz: null })}>
              <FaTimes />
            </button>
            <h2 className="modal-title delete-title">DELETE QUIZ</h2>
            <div className="delete-warning">
              <p>⚠️ Are you sure you want to delete this quiz?</p>
              <p className="warning-text">
                <strong>"{deleteModal.quiz?.title || "Untitled Quiz"}"</strong>
              </p>
              <p className="warning-text">
                This action cannot be undone. All associated lobbies and data will be permanently deleted.
              </p>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setDeleteModal({ show: false, quiz: null })}>
                CANCEL
              </button>
              <button className="btn-delete" onClick={confirmDeleteQuiz}>
                <FaTrash /> DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;
