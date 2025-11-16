import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaArrowLeft, FaChalkboardTeacher, FaSignOutAlt, FaGamepad, FaTrophy, FaUser, FaUsers } from "react-icons/fa";
import axios from "axios";
import "../../styles/Sidebar.css";

const SidebarStudent = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState({
    firstname: "",
    lastname: "",
    avatar: "",
    role: "student"
  });

  // Determine which menu item should be active based on current pathname
  const isClassroom = location.pathname.includes('/view-class/') && !location.pathname.includes('/classmates') && !location.pathname.includes('/leaderboards');
  const isJoinGame = location.pathname.includes('/join-game/');
  const isLeaderboards = location.pathname.includes('/leaderboards');
  const isClassmates = location.pathname.includes('/classmates');
  const isProfile = location.pathname.includes('/set-profile');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.firstName || user.firstname) {
            setUserData({
              firstname: user.firstName || user.firstname || "",
              lastname: user.lastName || user.lastname || "",
              avatar: user.avatar || "",
              role: user.role || "student"
            });
          }
        }

        const response = await axios.get("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) {
          setUserData({
            firstname: response.data.firstname || "",
            lastname: response.data.lastname || "",
            avatar: response.data.avatar || "",
            role: response.data.accountType || "student"
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData({
            firstname: user.firstName || user.firstname || "Student",
            lastname: user.lastName || user.lastname || "",
            avatar: user.avatar || "",
            role: user.role || "student"
          });
        }
      }
    };
    fetchUserData();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchUserData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        fetchUserData();
      }
    });
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('visibilitychange', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  const handleLeaveClassroom = async () => {
    if (!classId) {
      alert("No classroom selected.");
      return;
    }

    if (window.confirm("Are you sure you want to leave this classroom?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to leave a classroom.");
          navigate("/");
          return;
        }

        const response = await axios.post(
          `http://localhost:5000/api/classes/leave-classroom`,
          { classId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.status === 200) {
          alert(response.data.message || "You have left the classroom.");
          navigate("/my-class");
        }
      } catch (error) {
        console.error("Error leaving classroom:", error);
        const errorMessage = error.response?.data?.message || "Failed to leave classroom. Please try again.";
        alert(errorMessage);
      }
    }
  };

  return (
    <div className="sidebar10">
      <button className="back-btn" onClick={() => navigate("/student-home")}>
        <FaArrowLeft /> BACK
      </button>

      <div className="profile-section">
        <img 
          src={
            userData.avatar && userData.avatar.startsWith('data:image')
              ? userData.avatar
              : userData.avatar && userData.avatar.trim() !== ''
              ? `/Assets/${userData.avatar}.png`
              : "/Assets/avatar.png"
          } 
          alt="avatar" 
          className="avatar-image" 
          key={userData.avatar || 'default'}
          onError={(e) => {
            if (e.target.src !== "/Assets/avatar.png") {
            e.target.src = "/Assets/avatar.png";
            }
          }}
        />
        <h2>
          {userData.firstname && userData.lastname 
            ? `${userData.firstname} ${userData.lastname}`
            : userData.firstname || "Student"}
        </h2>
        <p className="role">{userData.role?.toUpperCase() || "STUDENT"}</p>
      </div>

      <div className="menu">
        <div 
          className={`menu-item ${isClassroom ? 'active' : ''}`}
          onClick={() => classId ? navigate(`/view-class/${classId}`) : navigate("/my-class")}
        >
          <FaChalkboardTeacher /> CLASSROOM
        </div>
        <div 
          className={`menu-item ${isJoinGame ? 'active' : ''}`}
          onClick={() => classId ? navigate(`/join-game/${classId}`) : navigate("/my-class")}
        >
          <FaGamepad /> JOIN GAME
        </div>
        <div 
          className={`menu-item ${isLeaderboards ? 'active' : ''}`}
          onClick={() => classId ? navigate(`/view-class/${classId}/leaderboards`) : navigate("/my-class")}
        >
          <FaTrophy /> LEADERBOARDS
        </div>
        <div 
          className={`menu-item ${isClassmates ? 'active' : ''}`}
          onClick={() => classId ? navigate(`/view-class/${classId}/classmates`) : navigate("/my-class")}
        >
          <FaUsers /> CLASSMATES
        </div>
        <div 
          className={`menu-item ${isProfile ? 'active' : ''}`}
          onClick={() => navigate("/set-profile")}
        >
          <FaUser /> PROFILE
        </div>
        <div 
          className="menu-item"
          onClick={handleLeaveClassroom}
        >
          <FaSignOutAlt /> LEAVE CLASSROOM
        </div>
      </div>
    </div>
  );
};

export default SidebarStudent;
