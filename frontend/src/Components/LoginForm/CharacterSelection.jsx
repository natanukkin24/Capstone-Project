import React, { useState } from "react";
import "../../styles/CharacterSelection.css";
import {
  FaSignOutAlt,
  FaGamepad,
  FaUser,
  FaTrophy,
  FaHatWizard,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const characters = [
  { name: "BOY", image: "/Assets/boy.png" },
  { name: "GIRL", image: "/Assets/girl.png" },
  { name: "ZOMBIE", image: "/Assets/zombie.png" },
  { name: "VAMPIRE", image: "/Assets/vampire.png" },
];

const CharacterSelection = () => {
  const [selectedCharacter, setSelectedCharacter] = useState("BOY");
  const navigate = useNavigate();

  return (
    <div className="character-selection-page">
      <aside className="sidebar9">
        <button
          className="leave-button01"
          onClick={() => navigate("/student-home")}
        >
          <FaSignOutAlt /> LEAVE
        </button>
        <div className="profile-info">
          <img src="/Assets/mason.png" alt="Avatar" className="avatar-image" />
          <h1 className="username">InsertDelete.</h1>
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              color: "#FFFFFF ",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            STUDENT
          </span>
        </div>
        <nav className="menu">
          <button onClick={() => navigate("/set-profile")}>
            <FaUser /> PROFILE
          </button>
          <button className="active">
            <FaHatWizard /> CHARACTER
          </button>
        </nav>
      </aside>

      <main className="character-content">
        <div className="character-box">
          <h3 className="character-title">CHARACTERS</h3>
          <div className="character-list">
            {characters.map((char) => (
              <div
                key={char.name}
                className={`character-card ${
                  selectedCharacter === char.name ? "selected" : ""
                }`}
              >
                <img
                  src={char.image}
                  alt={char.name}
                  className="character-image"
                />
                <p className="character-label">{char.name}</p>
                {selectedCharacter === char.name ? (
                  <button className="selected-button">SELECTED ✓</button>
                ) : (
                  <button
                    className="select-button"
                    onClick={() => setSelectedCharacter(char.name)}
                  >
                    SELECT
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CharacterSelection;
