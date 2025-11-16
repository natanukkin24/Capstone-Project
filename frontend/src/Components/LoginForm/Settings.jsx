import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaVolumeUp, FaMusic } from "react-icons/fa";
import "../../styles/Settings.css";

const translations = {
  english: {
    settingsTitle: "Settings",
    notifications: "NOTIFICATIONS",
    gameInvitation: "GAME INVITATION NOTIFICATION",
    classActivity: "CLASS ACTIVITY NOTIFICATION",
    soundEffects: "SOUND EFFECTS",
    sound: "SOUND",
    music: "MUSIC",
    languagePreferences: "LANGUAGE PREFERENCES",
    english: "ENGLISH",
    filipino: "FILIPINO",
    save: "SAVE",
    discard: "DISCARD",
  },
  filipino: {
    settingsTitle: "Mga Setting",
    notifications: "MGA ABISO",
    gameInvitation: "ABISO NG PAANYAYA SA LARO",
    classActivity: "ABISO NG AKTIBIDAD SA KLASE",
    soundEffects: "EPEKTO NG TUNOG",
    sound: "TUNOG",
    music: "MUSIKA",
    languagePreferences: "PREFERENSIYA SA WIKA",
    english: "INGLES",
    filipino: "FILIPINO",
    save: "I-SAVE",
    discard: "I-DISCARD",
  },
};

const Settings = () => {
  const navigate = useNavigate();

  const defaultSettings = {
    gameInvitation: true,
    classActivity: true,
    soundVolume: 100,
    musicVolume: 100,
    language: "english",
  };

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);
  const t = translations[settings.language];

  const handleSave = () => {
    localStorage.setItem("userSettings", JSON.stringify(settings));
    navigate("/student-home");
  };

  const handleBack = () => navigate("/student-home");

  const handleDiscard = () => setSettings(defaultSettings);

  return (
    <div className="settings-container">
      <header className="settings-header">
        <FaArrowLeft className="back-icon" onClick={handleBack} />
        <h1>{t.settingsTitle}</h1>
      </header>

      <main className="settings-main">
        <section className="settings-section">
          <h2 className="section-title">{t.notifications}</h2>
          <div className="notification-row">
            <div className="notification-item">
              <span className="notification-label">{t.gameInvitation}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.gameInvitation}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gameInvitation: e.target.checked,
                    })
                  }
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="notification-item">
              <span className="notification-label">{t.classActivity}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.classActivity}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      classActivity: e.target.checked,
                    })
                  }
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">{t.soundEffects}</h2>
          <div className="sound-controls">
            <div className="sound-item">
              <FaVolumeUp className="sound-icon" />
              <span className="sound-label">{t.sound}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.soundVolume}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    soundVolume: Number(e.target.value),
                  })
                }
              />
              <span className="volume-percentage">{settings.soundVolume}%</span>
            </div>
            <div className="sound-item">
              <FaMusic className="sound-icon" />
              <span className="sound-label">{t.music}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.musicVolume}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    musicVolume: Number(e.target.value),
                  })
                }
              />
              <span className="volume-percentage">{settings.musicVolume}%</span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">{t.languagePreferences}</h2>
          <label className="language-option">
            <input
              type="radio"
              name="language"
              value="english"
              checked={settings.language === "english"}
              onChange={(e) =>
                setSettings({ ...settings, language: e.target.value })
              }
            />
            <span className="radio-custom"></span>
            <span className="language-label">{t.english}</span>
          </label>
          <label className="language-option">
            <input
              type="radio"
              name="language"
              value="filipino"
              checked={settings.language === "filipino"}
              onChange={(e) =>
                setSettings({ ...settings, language: e.target.value })
              }
            />
            <span className="radio-custom"></span>
            <span className="language-label">{t.filipino}</span>
          </label>
        </section>

        <div className="action-buttons">
          <button className="save-btn" onClick={handleSave}>
            {t.save}
          </button>
          <button className="discard-btn" onClick={handleDiscard}>
            {t.discard}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
