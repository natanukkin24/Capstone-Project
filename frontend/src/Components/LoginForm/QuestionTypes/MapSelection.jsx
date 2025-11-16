import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../../styles/MapSelection.css";
import Sidebar from "../Sidebar";
import houseImg from "../../../Assets/House.png";
import lunarImg from "../../../Assets/Lunar.png";
import jungleImg from "../../../Assets/Jungle.png";

const MapSelection = () => {
  const navigate = useNavigate();
  const { classId, quizId } = useParams();
  const [selectedMap, setSelectedMap] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Demo images (you can replace these with your real map assets)
  const maps = [
    {
      id: "house",
      name: "House",
      img: houseImg
    },
    {
      id: "lunar",
      name: "Lunar",
      img: lunarImg
    },
    {
      id: "jungle",
      name: "Jungle",
      img: jungleImg
    },
  ];

  const handleSelect = (mapId) => setSelectedMap(mapId);

  const handleConfirm = async () => {
    if (!selectedMap) {
      setMessage("❌ Please select a map first!");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ Session expired. Please log in again.");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/quiz/${quizId}/set-map`,
        { map: selectedMap },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setMessage("✅ Map selected! Redirecting to lobby...");
        // Navigate to lobby after map selection
        setTimeout(() => {
          navigate(`/lobby/${quizId}`);
        }, 500);
      }
    } catch (error) {
      console.error("Map update failed:", error);
      const errorMessage = error.response?.data?.message || "Failed to enable map. Please try again.";
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="map-selection-container">
      <Sidebar />
      <div className="map-selection-content">
        <h2>🏞 Choose a Map for Your Quiz</h2>
        <p className="subtitle">Each map gives a unique challenge style for your students!</p>

        <div className="map-grid">
          {maps.map((map) => (
            <div
              key={map.id}
              className={`map-card ${selectedMap === map.id ? "selected" : ""}`}
              onClick={() => handleSelect(map.id)}
            >
              <div className="map-image-wrapper">
                <img src={map.img} alt={map.name} className="map-image" />
                {selectedMap === map.id && <div className="map-overlay">Selected</div>}
              </div>
              <h3>{map.name}</h3>
              <p>{map.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          className="confirm-btn"
          disabled={!selectedMap || isSubmitting}
        >
          {isSubmitting ? "Enabling Map..." : "Confirm Selection"}
        </button>

        {message && (
          <p className={`map-message ${message.includes("✅") ? "success" : "error"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default MapSelection;
