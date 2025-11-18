import React, { useEffect, useState } from "react";
import "../../styles/TeacherLeaderboards.css";
import SidebarStudent from "./SidebarStudent";
import { FaTrophy } from "react-icons/fa";
import { useParams } from "react-router-dom";
import axios from "axios";

const Leaderboards = () => {
  const { classId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/classes/${classId}/leaderboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setLeaderboard(res.data.leaderboard || []);
        setClassName(res.data.class || "");
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchLeaderboard();
  }, [classId]);

  const medals = ["🥇", "🥈", "🥉"];
  const colors = ["#4f7a38", "#e9d18d", "#c58a4f"];

  return (
    <div className="leaderboard-container">
      <SidebarStudent />

      {/* Main Content */}
      <div className="main-content">
        <div className="leaderboard-header">
          <FaTrophy className="trophy-icon" />
          <h1 className="leaderboard-title">{className} LEADERBOARD</h1>
        </div>

        {loading ? (
          <p>Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p>No students found in this class.</p>
        ) : (
          <div className="leaderboard-table">
            <div className="table-header">
              <span>RANK</span>
              <span>NAME</span>
              <span>POINTS</span>
            </div>

            {leaderboard.map((student, index) => (
              <div
                key={student._id}
                className="table-row"
                style={{
                  backgroundColor: colors[index] || "#a6a6a6",
                }}
              >
                <span>{medals[index] || index + 1}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src={
                      student.avatar && student.avatar.startsWith('data:image')
                        ? student.avatar
                        : student.avatar && student.avatar.trim() !== ''
                        ? `/Assets/${student.avatar}.png`
                        : "/Assets/avatar.png"
                    }
                    alt="avatar"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid white",
                    }}
                    onError={(e) => {
                      if (e.target.src !== "/Assets/avatar.png") {
                        e.target.src = "/Assets/avatar.png";
                      }
                    }}
                  />
                  {student.firstname} {student.lastname}
                </span>
                <span>{student.points?.toLocaleString() || 0} ⭐</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboards;
