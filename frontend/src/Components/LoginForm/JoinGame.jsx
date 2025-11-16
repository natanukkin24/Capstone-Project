import React, { useState, useEffect } from "react";
import "../../styles/Leaderboards.css";
import SidebarStudent from "./SidebarStudent";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const JoinGame = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available quizzes from API
  useEffect(() => {
    const fetchAvailableQuizzes = async () => {
      let currentClassId = classId;
      
      // If classId is not in URL, try to get it from student's enrolled classes
      if (!currentClassId) {
      try {
        const token = localStorage.getItem("token");
          if (!token) {
            navigate("/");
            return;
        }

          const response = await axios.get("http://localhost:5000/api/classes/my-classes", {
          headers: { Authorization: `Bearer ${token}` },
        });

          if (response.data && response.data.classrooms && response.data.classrooms.length > 0) {
            // Use the first enrolled class
            currentClassId = response.data.classrooms[0]._id;
            // Update URL to include classId
            navigate(`/join-game/${currentClassId}`, { replace: true });
          } else {
            setError("No classes found. Please join a class first.");
            setLoading(false);
            return;
        }
      } catch (error) {
          console.error("Error fetching classes:", error);
          setError("Class ID is missing. Please go back and select a class.");
          setLoading(false);
          return;
        }
      }
      
      if (!currentClassId) {
        setError("Class ID is missing");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        console.log("Fetching quizzes for classId:", currentClassId);
        const response = await axios.get(
          `http://localhost:5000/api/quiz/available/${currentClassId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("API Response:", response.data);
        if (response.data && response.data.quizzes) {
          console.log("Quizzes found:", response.data.quizzes.length);
          setAvailableQuizzes(response.data.quizzes);
        } else {
          console.log("No quizzes in response");
          setAvailableQuizzes([]);
        }
        setError(null);
      } catch (error) {
        console.error("Error fetching available quizzes:", error);
        console.error("Error details:", error.response?.data);
        const errorMessage = error.response?.data?.message || error.message || "Failed to load available quizzes. Please try again.";
        setError(errorMessage);
        if (error.response?.status === 401) {
          navigate("/");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableQuizzes();
  }, [classId, navigate]);

  const handleJoinGame = async (quizId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to join a game");
        navigate("/");
        return;
      }

      // Join the lobby
      const response = await axios.post(
        `http://localhost:5000/api/quiz/${quizId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        // Navigate to the lobby
        navigate(`/lobby/${quizId}`);
      }
    } catch (error) {
      console.error("Error joining game:", error);
      const errorMessage = error.response?.data?.message || "Failed to join game. Please try again.";
      alert(errorMessage);
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return { text: "Waiting", color: "#738d4d" };
    
    switch (status.toLowerCase()) {
      case "waiting":
        return { text: "Waiting", color: "#738d4d" };
      case "starting":
        return { text: "Starting", color: "#f9a602" };
      case "in_progress":
        return { text: "In Progress", color: "#c5a65e" };
      case "completed":
        return { text: "Completed", color: "#888" };
      default:
        return { text: "Waiting", color: "#738d4d" };
    }
  };

  // Error boundary - if component fails, show error (but allow loading to complete first)
  if (!classId && !loading && error && error.includes("Class ID is missing")) {
    return (
      <div className="leaderboard-page">
        <SidebarStudent />
        <main className="leaderboard-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white", padding: "30px" }}>
          <h1 style={{ color: "#f9a602" }}>Error</h1>
          <p>Class ID is missing. Please go back and try again.</p>
          <button onClick={() => navigate("/my-class")} style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#f9a602", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Go Back
          </button>
        </main>
      </div>
    );
  }

  // Debug: Log component state
  console.log("JoinGame render - classId:", classId, "loading:", loading, "error:", error, "quizzes:", availableQuizzes.length);

  return (
    <div className="leaderboard-page">
      {/* ✅ SIDEBAR */}
      <SidebarStudent />

      {/* ✅ MAIN CONTENT */}
      <main
        className="leaderboard-content"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "white",
          padding: "30px",
        }}
      >
        <h1 style={{ color: "#f9a602" }}>Join a Game</h1>
        <p>Choose an available quiz below to join the lobby.</p>

        {/* 🧩 Available Games */}
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            marginTop: "40px",
            backgroundColor: "#fff8dc",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 3px 5px rgba(0,0,0,0.3)",
          }}
        >
          <h2 style={{ color: "#6c5d38", marginBottom: "10px" }}>
            Available Quizzes
          </h2>

          {loading ? (
            <p style={{ color: "#333" }}>Loading quizzes...</p>
          ) : error ? (
            <p style={{ color: "#d32f2f" }}>{error}</p>
          ) : availableQuizzes.length === 0 ? (
            <p style={{ color: "#333" }}>No quizzes available right now. Check back later!</p>
          ) : (
            availableQuizzes.map((quiz) => {
              const statusInfo = formatStatus(quiz.status);
              const canJoin = quiz.status === "waiting" && !quiz.isJoined;
              
              return (
                <div
                  key={quiz._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: statusInfo.color,
                    color: "white",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "18px" }}>{quiz.title}</strong>
                    {quiz.description && (
                      <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.9 }}>
                        {quiz.description}
                      </div>
                    )}
                    <div style={{ fontSize: "14px", marginTop: "8px" }}>
                      👥 {quiz.playerCount} Players |{" "}
                      {statusInfo.text === "Waiting" ? "🟢 " : statusInfo.text === "Starting" ? "🟡 " : "🔴 "}
                      {statusInfo.text}
                    {quiz.isJoined && " | ✓ You're in this lobby"}
                    </div>
                    {quiz.difficulty && (
                      <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.8 }}>
                        Difficulty: {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleJoinGame(quiz._id)}
                    disabled={!canJoin}
                    style={{
                      backgroundColor: canJoin ? "#f9a602" : "#888",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      color: "white",
                      cursor: canJoin ? "pointer" : "not-allowed",
                      fontWeight: "bold",
                      marginLeft: "15px",
                    }}
                  >
                    {quiz.isJoined ? "In Lobby" : canJoin ? "Join" : "Unavailable"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default JoinGame;
