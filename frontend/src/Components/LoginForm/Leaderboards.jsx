import React, { useEffect, useState } from "react";
import "../../styles/Leaderboards.css";
import SidebarStudent from "./SidebarStudent";
import { FaTrophy } from "react-icons/fa";
import { useParams } from "react-router-dom";

const Leaderboards = () => {
  const { classId } = useParams(); // ✅ We'll use the classId from URL (e.g., /view-class/:classId/leaderboards)
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token"); // ✅ Token from login
        if (!token) {
          console.error("No token found, please login again");
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/classes/${classId}/leaderboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch leaderboard");

        const data = await res.json();
        setLeaderboardData(data.leaderboard || []);
        setClassInfo({
          subject: data.subject,
          gradeLevel: data.gradeLevel,
        });
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchLeaderboard();
  }, [classId]);

  return (
    <div className="leaderboard-page">
      <SidebarStudent />

      <main className="leaderboard-content">
        <div
          className="leaderboard-title"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            backgroundColor: "#6c5d38",
            padding: "6px 12px",
            borderRadius: "8px",
            boxShadow: "0 3px 5px rgba(0, 0, 0, 0.3)",
            color: "white",
            marginBottom: "20px",
          }}
        >
          <FaTrophy
            className="trophy-icon"
            style={{ fontSize: "28px", color: "#f9a602" }}
          />
          <span>
            {classInfo
              ? `${classInfo.subject} — Grade ${classInfo.gradeLevel}`
              : "LEADERBOARDS"}
          </span>
        </div>

        {loading ? (
          <p style={{ color: "#fff" }}>Loading leaderboard...</p>
        ) : leaderboardData.length === 0 ? (
          <p style={{ color: "#fff" }}>No students found in this class.</p>
        ) : (
          <div
            className="leaderboard-table"
            style={{
              width: "100%",
              borderRadius: "10px",
              backgroundColor: "#fff8dc",
              padding: "15px",
            }}
          >
            <div
              className="table-header1"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 3fr 2fr",
                alignItems: "center",
                textAlign: "center",
                padding: "10px 15px",
                borderBottom: "1px solid #ccc",
                fontWeight: "bold",
              }}
            >
              <span style={{ justifySelf: "center" }}>RANK</span>
              <span style={{ justifySelf: "center" }}>NAME</span>
              <span style={{ justifySelf: "center" }}>POINTS</span>
            </div>

            {leaderboardData.map((player) => (
              <div
                key={player._id}
                className={`table-row rank-${
                  player.rank <= 3 ? player.rank : "default"
                }`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 3fr 2fr",
                  textAlign: "center",
                  alignItems: "center",
                  padding: "10px 15px",
                  borderBottom: "1px solid #ccc",
                  backgroundColor:
                    player.rank === 1
                      ? "#738d4d"
                      : player.rank === 2
                      ? "#c5a65e"
                      : player.rank === 3
                      ? "#6c5d38"
                      : "#808d86",
                  color: "white",
                }}
              >
                <div
                  className="rank-col"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {player.rank <= 3 ? (
                    <FaTrophy
                      className={`trophy-icon`}
                      style={{
                        color:
                          player.rank === 1
                            ? "gold"
                            : player.rank === 2
                            ? "silver"
                            : "#cd7f32",
                      }}
                    />
                  ) : (
                    <div className="rank-circle">{player.rank}</div>
                  )}
                </div>

                <div
                  className="name-col"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: "10px",
                  }}
                >
                  <img
                    src={player.profileImage || "/Assets/avatar.png"}
                    alt="avatar"
                    className="avatar-small"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                    }}
                  />
                  <span>{player.username || `${player.firstname} ${player.lastname}`}</span>
                </div>

                <div
                  className="points-col"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {(player.points || 0).toLocaleString()} <span>⭐</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboards;
