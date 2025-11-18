import React, { useEffect, useState } from "react";
import "../../styles/Lobby.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import websocketService from "../../services/websocket";
import { FaPlay } from "react-icons/fa";

const Lobby = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [classId, setClassId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [players, setPlayers] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch lobby data dynamically
  const fetchLobbyData = async () => {
    if (!quizId) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isTeacher = user.role === "teacher";
      const role = user.role || "student";
      setUserRole(role);
      
      // For students, rejoin lobby when fetching data
      if (role === "student" && quizId) {
        // Rejoin the lobby
        axios.post(
          `http://localhost:5000/api/quiz/${quizId}/join`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch((error) => {
          console.error("Error rejoining lobby:", error);
          // Continue even if rejoin fails - might already be in lobby
        });
      }

      // Fetch lobby data based on user role
      if (isTeacher) {
        const response = await axios.get(
          `http://localhost:5000/api/quiz/${quizId}/lobby-details`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data) {
          setQuizTitle(response.data.quiz?.title || "");
          if (response.data.players && Array.isArray(response.data.players)) {
            setPlayers(response.data.players);
          } else {
            setPlayers([]);
          }
          if (response.data.quiz && response.data.quiz.classId) {
            // Ensure classId is a string
            const id = response.data.quiz.classId;
            setClassId(typeof id === 'object' ? id.toString() : id);
          }
        }
      } else {
        // For students
        try {
          const response = await axios.get(
            `http://localhost:5000/api/quiz/${quizId}/lobby`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data) {
            setQuizTitle(response.data.quiz?.title || "");
            if (response.data.players && Array.isArray(response.data.players)) {
              setPlayers(response.data.players);
            } else {
              setPlayers([]);
            }
            if (response.data.quiz && response.data.quiz.classId) {
              // Ensure classId is a string
              const id = response.data.quiz.classId;
              setClassId(typeof id === 'object' ? id.toString() : id);
            }
          }
        } catch (error) {
          console.error("Error fetching lobby for student:", error);
          // If lobby doesn't exist (404), the error response might still have quiz data
          if (error.response && error.response.data && error.response.data.quiz) {
            setQuizTitle(error.response.data.quiz.title || "");
            const id = error.response.data.quiz.classId;
            setClassId(typeof id === 'object' ? id.toString() : id);
          }
          setPlayers([]);
        }
      }
    } catch (error) {
      console.error("Error fetching lobby data:", error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchLobbyData();

    // Set up polling to refresh lobby data every 1 second (faster for better UX)
    const interval = setInterval(fetchLobbyData, 1000);

    // Cleanup: Remove student from lobby when component unmounts
    return () => {
      clearInterval(interval);
      // Only cleanup if user is a student (teachers don't need to leave on unmount)
      if (userRole === "student" && quizId) {
        const token = localStorage.getItem("token");
        if (token) {
          // Leave lobby silently (don't wait for response)
          axios.post(
            `http://localhost:5000/api/quiz/${quizId}/leave`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).catch(() => {
              // Ignore errors during cleanup
            });
          websocketService.leaveQuizRoom(quizId);
        }
      }
    };
  }, [quizId, navigate, userRole]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (!quizId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    websocketService.connect(token, quizId);

    // Listen for player joined lobby event
    const handlePlayerJoined = (data) => {
      console.log("Player joined lobby:", data);
      if (data.quizId === quizId) {
        // Add the new player to the list
        setPlayers(prev => {
          // Check if player already exists
          const exists = prev.some(p => (p.id || p._id) === (data.player.id || data.player._id));
          if (exists) {
            return prev; // Don't add duplicate
          }
          return [...prev, data.player];
        });
      }
    };

    // Listen for player left lobby event
    const handlePlayerLeft = (data) => {
      console.log("Player left lobby:", data);
      if (data.quizId === quizId) {
        // Remove the player from the list
        setPlayers(prev => prev.filter(p => (p.id || p._id) !== data.studentId));
      }
    };

    // Students listen for game start event
    const handleGameStarted = () => {
      if (userRole === "student") {
        // Automatically navigate students to game when teacher starts it
        navigate(`/game/${quizId}`);
      }
    };

    websocketService.on('player-joined-lobby', handlePlayerJoined);
    websocketService.on('player-left-lobby', handlePlayerLeft);
    if (userRole === "student") {
      websocketService.on('game-started', handleGameStarted);
    }

    return () => {
      websocketService.off('player-joined-lobby');
      websocketService.off('player-left-lobby');
      if (userRole === "student") {
        websocketService.off('game-started');
      }
      // Cleanup: Leave WebSocket room when component unmounts
      if (quizId) {
        websocketService.leaveQuizRoom(quizId);
      }
    };
  }, [quizId, userRole, navigate]);

  // Handle start game (for teachers)
  const handleStartGame = () => {
    if (!quizId) {
      alert("Quiz ID is missing. Cannot start game.");
      return;
    }

    if (players.length === 0) {
      alert("No players in the lobby. Wait for students to join before starting the game.");
      return;
    }

    // Emit game start event to all players in the quiz room
    websocketService.sendGameState({
      quizId,
      gameState: { status: 'started' }
    });

    // Navigate teacher to game
    navigate(`/game/${quizId}`);
  };

  // Handle leave lobby
  const handleLeaveLobby = async () => {
    if (!classId) {
      // If no classId, navigate to home
      if (userRole === "teacher") {
        navigate("/my-class-teacher");
      } else {
        navigate("/my-class");
      }
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in again.");
        navigate("/");
        return;
      }

      // Leave WebSocket room if quizId exists
      if (quizId) {
        websocketService.leaveQuizRoom(quizId);

        // Call appropriate API endpoint based on user role
        if (userRole === "teacher") {
          await axios.post(
            `http://localhost:5000/api/quiz/${quizId}/teacher-leave`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          // Student leaving lobby
          await axios.post(
            `http://localhost:5000/api/quiz/${quizId}/leave`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }
      }
    } catch (error) {
      console.error("Error leaving lobby:", error);
      // Continue to navigate even if API call fails
    }

    // Always navigate to classroom after leaving
    if (userRole === "teacher") {
      // Ensure classId is a string for navigation
      const id = classId ? (typeof classId === 'object' ? classId.toString() : classId) : null;
      if (id) {
        navigate(`/classroom/${id}`);
      } else {
        // Fallback if classId is not available
        navigate("/my-class-teacher");
      }
    } else {
      // Ensure classId is a string for navigation
      const id = classId ? (typeof classId === 'object' ? classId.toString() : classId) : null;
      if (id) {
        navigate(`/view-class/${id}`);
      } else {
        // Fallback if classId is not available
        navigate("/my-class");
      }
    }
  };

  // Get avatar URL for player
  const getAvatarUrl = (avatar) => {
    if (!avatar) return "/Assets/avatar.png";
    if (avatar.startsWith('data:image')) {
      return avatar;
    }
    return `/Assets/${avatar}.png`;
  };

  return (
    <div className="lobby-container">
      <div className="lobby-main">
        <h1 className="lobby-title">{quizTitle || "LOBBY"}</h1>
        <p className="lobby-waiting">Waiting for players...</p>

        <div className="player-list">
          <div className="player-list-header">Players ({players.length})</div>
          <div className="player-list-slots">
            {loading ? (
              <p style={{ color: "white", textAlign: "center", padding: "20px" }}>
                Loading players...
              </p>
            ) : (
              // Show 8 player slots - filled ones first, then empty ones
              Array.from({ length: 8 }, (_, index) => {
                const player = players[index];
                return (
                  <div 
                    key={player ? (player.id || player._id) : `empty-${index}`} 
                    className={player ? "player-slot filled" : "player-slot"}
                  >
                    {player ? (
                      <>
                        {player.avatar ? (
                          <img
                            src={getAvatarUrl(player.avatar)}
                            alt={player.username || "Player Avatar"}
                            className="player-avatar"
                            onError={(e) => {
                              e.target.src = "/Assets/avatar.png";
                            }}
                          />
                        ) : (
                          <div className="empty-avatar-placeholder"></div>
                        )}
                        <span className="player-username">
                          {player.firstname && player.lastname
                            ? `${player.firstname} ${player.lastname}`
                            : player.username || "Player"}
                        </span>
                      </>
                    ) : (
                      <div className="empty-avatar-placeholder"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <aside className="lobby-sidebar">
        {userRole === "teacher" && (
          <button 
            className="lobby-btn start-game-btn" 
            onClick={handleStartGame}
            disabled={players.length === 0}
            style={{
              backgroundColor: players.length === 0 ? "#888" : "#4CAF50",
              marginBottom: "15px",
              cursor: players.length === 0 ? "not-allowed" : "pointer",
              borderRadius: "12px",
              padding: "15px 10px",
              border: "3px solid #000000",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%"
            }}
          >
            <FaPlay />
            <span>START GAME</span>
          </button>
        )}
        <button className="lobby-btn" onClick={handleLeaveLobby}>
          <img src="/Assets/back.png" alt="Leave" />
          <span>LEAVE LOBBY</span>
        </button>
      </aside>
    </div>
  );
};

export default Lobby;
