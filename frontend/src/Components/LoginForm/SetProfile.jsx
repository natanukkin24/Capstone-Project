import React, { useState, useEffect, useRef } from "react";
import "../../styles/SetProfile.css";
import { FaSignOutAlt, FaGamepad, FaUser, FaTrophy, FaCamera} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const avatarList = [
  "Oliver", "Eliza", "Ryan", "Mason", "Kimberly",
  "Adrian", "Riley", "Avery", "Ryker", "Jack",
  "Andrea", "Jessica", "Leah", "Liliana", "Eden",
  "Vivian", "Jameson", "Maria", "Valentina", "Emery",
];

const SetProfile = () => {
  const [selectedAvatar, setSelectedAvatar] = useState("Adrian");
  const [username, setUsername] = useState("");
  const [section, setSection] = useState("");
  // const [isEditingUsername, setIsEditingUsername] = useState("");
  const [hasCustomUsername, setHasCustomUsername] = useState(false);
  const [spinKey, setSpinKey] = useState(null);
  const [customAvatar, setCustomAvatar] = useState(null); // Base64 string for custom image
  const [avatarPreview, setAvatarPreview] = useState(null); // Preview URL
  const fileInputRef = useRef(null);

  const [firstName, setfirstName] = useState("");
  const [lastName, setlastName] = useState("");
  const [gender, setGender] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [role, setRole] = useState(""); // student or teacher
  const [home, setHome] = useState("");

  const navigate = useNavigate();

  // 🔹 Fetch profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found — user might not be logged in.");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data;
        
        

        // ✅ Populate UI with backend data
        setfirstName(`${data.firstname}` || "");
        setlastName(`${data.lastname}` || "");
        setUsername(`${data.firstname}`|| "");
        setGender(data.gender || "");
        setGradeLevel(data.gradeLevel || "");
        setSection(data.section || "");
        setSelectedAvatar(data.avatar || "Adrian");
        setRole(data.accountType || "");
        setHome(`/${data.accountType}-home`);
        
        // Check if avatar is a base64 image (custom image)
        if (data.avatar && data.avatar.startsWith('data:image')) {
          setCustomAvatar(data.avatar);
          setAvatarPreview(data.avatar);
        } else {
          setCustomAvatar(null);
          setAvatarPreview(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error.response?.data || error.message);
      }
    };

    fetchProfile();
  }, []);

  // 🔹 Save/update profile to backend
  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Please log in again.");

      const updateData = {
        firstName,
        lastName,
        gender,
        gradeLevel,
        ...(role === 'student' && { section }), // Only students have sections
        avatar: customAvatar || selectedAvatar, // Use custom image if available, otherwise use predefined avatar
      };

      console.log("Sending update data:", updateData);

      const res = await axios.put("http://localhost:5000/api/profile", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Profile updated successfully!");
      console.log("Updated user:", res.data.user);
      
      // Dispatch event to notify sidebars to refresh
      window.dispatchEvent(new Event('profileUpdated'));
      
      navigate(home);
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update profile.";
      console.error("Error details:", error.response?.data);
      alert(`Failed to update profile: ${errorMessage}`);
    }
  };

  // Compress and resize image
  const compressImage = (file, maxWidth = 300, maxHeight = 300, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const base64String = canvas.toDataURL('image/jpeg', quality);
          resolve(base64String);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle custom image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      // Compress and resize the image
      const compressedBase64 = await compressImage(file, 300, 300, 0.8);
      setCustomAvatar(compressedBase64);
      setAvatarPreview(compressedBase64);
      setSelectedAvatar(null); // Clear predefined avatar selection
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    }
  };

  // Handle avatar click to trigger file upload
  const handleAvatarClick = () => {
    if (role === 'student' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="profile-page">
      <aside className="sidebar3">
        <button className="leave-button" onClick={() => navigate(-1)}>
          <FaSignOutAlt /> BACK
        </button>

        <div className="sidebar-profile">
          <div 
            className={`avatar-container ${role === 'student' ? 'clickable' : ''}`}
            onClick={handleAvatarClick}
            title={role === 'student' ? 'Click to upload your own image' : ''}
          >
            <img
              src={
                avatarPreview
                  ? avatarPreview
                  : selectedAvatar
                  ? `/Assets/${selectedAvatar}.png`
                  : "/Assets/Adrian.png"
              }
              alt="Selected Avatar"
              className={`avatar-large ${spinKey === selectedAvatar ? "spin" : ""}`}
            />
            {role === 'student' && (
              <div className="avatar-hover-overlay">
                <FaCamera className="camera-icon" />
                <span className="hover-text">Upload Image</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        <h1 className="username">{username}</h1>
        <span
          style={{
            fontFamily: "Poppins, sans-serif",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {role.toUpperCase()}
        </span>

        <nav className="menu">
          <button className="active">
            <FaUser /> PROFILE
          </button>
        </nav>
      </aside>

      <main className="main-profile">
        <div className="form-section">
          {/* FULL NAME */}
          <div className="input-row">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setfirstName(e.target.value)}
            />
          </div>
          <div className="input-row">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setlastName(e.target.value)}
            />
          </div>

          {/* GENDER */}
          <div className="input-row">
            <label>GENDER</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* GRADE LEVEL */}
          <div className="input-row">
            <label>GRADE LEVEL</label>
            <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
              <option value="">Grade Level</option>
              <option value="grade 3">Grade 3</option>
              <option value="grade 4">Grade 4</option>
              <option value="grade 5">Grade 5</option>
              <option value="grade 6">Grade 6</option>
            </select>
          </div>

          {role !== 'teacher' && (
            <div className="input-row">
              <label>SECTION</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>
          )}
          
          {/* BUTTONS */}
          <div className="form-buttons">
            <button className="save-button" onClick={handleSaveProfile}>
              SAVE
            </button>

            <button
              className="discard-button"
              onClick={() => window.location.reload()}
            >
              DISCARD
            </button>
          </div>
        </div>

        {/* AVATAR SELECTION */}
        <div className="avatar-selection">
          <div className="avatar-header">
            <h3>AVATARS</h3>
          </div>
          <div className="avatar-grid">
            {avatarList.map((name) => (
              <div
                key={name}
                className={`avatar-card ${selectedAvatar === name ? "selected" : ""}`}
                onClick={() => {
                  setSelectedAvatar(name);
                  setSpinKey(name);
                  setTimeout(() => setSpinKey(null), 600);
                  
                  // Clear custom avatar when selecting predefined avatar
                  setCustomAvatar(null);
                  setAvatarPreview(null);

                  if (!hasCustomUsername || username.trim() === "") {
                    setUsername(name);
                    setHasCustomUsername(false);
                  }
                }}
              >
                <img
                  src={`/Assets/${name}.png`}
                  alt={name}
                  className={`avatar-option ${spinKey === name ? "spin" : ""}`}
                />
                <p className="avatar-name">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SetProfile;
