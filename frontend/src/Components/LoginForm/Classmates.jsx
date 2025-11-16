import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/ViewStudent.css";
import SidebarStudent from "./SidebarStudent";
import { FaUserGraduate } from "react-icons/fa";

const Classmates = () => {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/classes/${classId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setStudents(response.data.students || []);
        setClassInfo(response.data.classroom || response.data.classrooms || null);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchStudents();
    }
  }, [classId, navigate]);

  const handleProfile = (student) => {
    alert(`Viewing profile of ${student.firstname} ${student.lastname}`);
  };

  return (
    <div className="view-student-container">
      <SidebarStudent />

      {/* Main Content */}
      <main className="students-section">
        <h1 className="students-title">
          <FaUserGraduate className="student-logo" /> CLASSMATES
        </h1>

        {loading ? (
          <p className="loading-text">Loading classmates...</p>
        ) : students.length === 0 ? (
          <p className="no-students-text">No classmates found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>USERNAME</th>
                  <th>GENDER</th>
                  <th>EMAIL</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id}>
                    <td>
                      {i + 1}. {s.firstname} {s.lastname}
                    </td>
                    <td>{s.username || "N/A"}</td>
                    <td>{s.gender || "N/A"}</td>
                    <td>{s.email || "N/A"}</td>
                    <td className="action-cell">
                      <button
                        className="profile-btn"
                        onClick={() => handleProfile(s)}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Classmates;

