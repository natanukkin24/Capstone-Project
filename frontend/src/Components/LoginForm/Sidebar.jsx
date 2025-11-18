import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaArrowLeft, FaUsers, FaTrophy, FaGamepad, FaClipboardList, FaChalkboardTeacher, FaTrash } from "react-icons/fa";
import axios from "axios";
import "../../styles/Sidebar.css";

const Sidebar = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState({
    firstname: "",
    lastname: "",
    avatar: "",
    role: "teacher"
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Determine which menu item should be active based on current pathname
  const activeItem = useMemo(() => {
    const pathname = location.pathname || '';
    const isViewStudents = pathname.includes('/view-students/');
    const isLeaderboards = pathname.includes('/leaderboards/');
    const isCreateQuiz = pathname.includes('/create-quiz/') || pathname.includes('/select-gamemode/');
    const isMyQuizzes = pathname.includes('/my-quizzes/');
    // Check if pathname starts with /classroom/
    const isClassroom = pathname.startsWith('/classroom/');
    
    // Default to Classroom if no specific page is matched (when classId is present)
    // Priority: Check specific routes first, then default to classroom if classId exists
    if (isViewStudents) {
      return 'view-students';
    } else if (isLeaderboards) {
      return 'leaderboards';
    } else if (isCreateQuiz) {
      return 'create-quiz';
    } else if (isMyQuizzes) {
      return 'my-quizzes';
    } else if (isClassroom) {
      return 'classroom';
    } else if (classId) {
      return 'classroom'; // Default to classroom when classId exists
    } else {
      return 'view-students'; // Fallback default
    }
  }, [location.pathname, classId]);

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
              role: user.role || "teacher"
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
            role: response.data.accountType || "teacher"
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData({
            firstname: user.firstName || user.firstname || "Teacher",
            lastname: user.lastName || user.lastname || "",
            avatar: user.avatar || "",
            role: user.role || "teacher"
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

  const handleDeleteClassroom = () => {
    if (!classId) {
      alert("No classroom selected.");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDeleteClassroom = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to delete a classroom.");
        navigate("/");
        return;
      }

      const response = await axios.delete(`http://localhost:5000/api/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 204) {
        alert(response.data.message || "Classroom deleted successfully.");
        setShowDeleteModal(false);
        navigate("/my-class-teacher");
      }
    } catch (error) {
      console.error("Error deleting classroom:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete classroom. Please try again.";
      alert(errorMessage);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="sidebar10">
      <button className="back-btn" onClick={() => navigate("/my-class-teacher")}>
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
            : userData.firstname || "Teacher"}
        </h2>
        <p className="role">{userData.role?.toUpperCase() || "TEACHER"}</p>
      </div>

      <div className="menu">
        <div 
          className={`menu-item ${activeItem === 'classroom' ? 'active' : ''}`}
          onClick={() => classId ? navigate(`/classroom/${classId}`) : navigate("/my-class-teacher")}
        >
          <FaChalkboardTeacher /> CLASSROOM
        </div>
        <div 
          className={`menu-item ${activeItem === 'view-students' ? 'active' : ''}`}
          onClick={() => classId ? navigate(`/view-students/${classId}`) : navigate("/my-class-teacher")}
        >
          <FaUsers /> STUDENTS
        </div>
        <div 
          className={`menu-item ${activeItem === 'leaderboards' ? 'active' : ''}`}
          onClick={() => classId ? navigate(`/leaderboards/${classId}`) : navigate("/my-class-teacher")}
        >
          <FaTrophy /> LEADERBOARDS
        </div>
        <div 
          className={`menu-item ${activeItem === 'create-quiz' ? 'active' : ''}`}
          onClick={() => classId ? navigate(`/create-quiz/${classId}/create-questions`) : navigate("/my-class-teacher")}
        >
          <FaGamepad /> CREATE QUIZ
        </div>
        <div 
          className={`menu-item ${activeItem === 'my-quizzes' ? 'active' : ''}`}
          onClick={() => navigate(classId ? `/my-quizzes/${classId}` : "/my-class-teacher")}
        >
          <FaClipboardList /> MY QUIZZES
        </div>
        <div 
          className="menu-item"
          onClick={handleDeleteClassroom}
          style={{ color: '#d32f2f', marginTop: '10px' }}
        >
          <FaTrash /> DELETE CLASSROOM
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title delete-title">DELETE CLASSROOM</h2>
            <div className="delete-warning">
              <p>⚠️ Are you sure you want to delete this classroom?</p>
              <p className="warning-text">
                This action cannot be undone. All quizzes, students, lobbies, and data associated with this
                classroom will be permanently deleted.
              </p>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                CANCEL
              </button>
              <button className="btn-delete" onClick={confirmDeleteClassroom}>
                <FaTrash /> DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
