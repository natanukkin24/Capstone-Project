import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/ViewStudent.css";
import Sidebar from "./Sidebar"

import {
  FaArrowLeft,
  FaUsers,
  FaTrophy,
  FaGamepad,
  FaClipboardList,
  FaUserGraduate,
} from "react-icons/fa";

const ViewStudents = () => {
  const { classId } = useParams(); // ✅ gets the classId from the URL
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [teacher, setTeacher] = useState(null); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/classes/${classId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setStudents(response.data.students || []);
        setClassInfo(response.data.classroom || null);
        setTeacher(response.data.teacher || null); // ✅ NEW
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classId]);

  const handleBack = () => navigate("/my-class-teacher");

  const handleProfile = (student) => {
    alert(`Viewing profile of ${student.firstname} ${student.lastname}`);
  };

  const handleRemove = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/classes/remove-student",
        { classId, studentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // success -> update UI
      setStudents((prev) => prev.filter((s) => s._id !== studentId));
      alert(res.data.message || "Student removed");
      } catch (err) {
        console.error("Error removing student:", err);
        const msg = err.response?.data?.message || "Failed to remove student";
        alert(msg);
      }
  };


  return (
    <div className="view-student-container">
      <Sidebar />

      {/* Main Content */}
      <main className="students-section">
        <h1 className="students-title">
          <FaUserGraduate className="student-logo" /> STUDENTS
        </h1>

        {loading ? (
          <p className="loading-text">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="no-students-text">No students found.</p>
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
                    <td>{s.username}</td>
                    <td>{s.gender}</td>
                    <td>{s.email}</td>
                    <td className="action-cell">
                      <button
                        className="profile-btn"
                        onClick={() => handleProfile(s)}
                      >
                        Profile
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(s._id)}
                      >
                        Remove
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

export default ViewStudents;
