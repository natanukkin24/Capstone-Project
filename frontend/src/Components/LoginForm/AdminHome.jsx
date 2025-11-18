import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaUserPlus, FaChalkboardTeacher } from "react-icons/fa";
import "../../styles/Admin.css";

const AdminHome = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header__title">
          <FaUserShield size={32} />
          <div>
            <p className="admin-label">ADMINISTRATOR</p>
            <h1>Control Center</h1>
          </div>
        </div>
        <div className="admin-header__actions">
          <button onClick={() => navigate("/set-profile")}>Profile</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-card highlight">
          <h2>Empower your teachers</h2>
          <p>
            Admin accounts can onboard teachers, reset their access, and keep the
            classrooms organized.
          </p>
          <button onClick={() => navigate("/admin/create-teacher")}>
            <FaUserPlus /> Create Teacher
          </button>
        </section>

        <section className="admin-grid">
          <div className="admin-card">
            <FaChalkboardTeacher size={32} />
            <h3>Teacher Accounts</h3>
            <p>Review the teachers you have created and keep their access up to date.</p>
            <button
              className="secondary"
              onClick={() => navigate("/admin/create-teacher")}
            >
              Manage Teachers
            </button>
          </div>

          <div className="admin-card">
            <FaUserShield size={32} />
            <h3>Security Tips</h3>
            <p>Share credentials securely and remind teachers to change passwords on first login.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminHome;

