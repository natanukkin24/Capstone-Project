import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/Admin.css";

const AdminCreateTeacher = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    birthMonth: "",
    birthDay: "",
    birthYear: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 80 }, (_, idx) => currentYear - idx);
  }, []);

  const days = useMemo(() => Array.from({ length: 31 }, (_, idx) => idx + 1), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.firstname || !form.lastname || !form.email) {
      alert("Please fill in the required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!form.birthMonth || !form.birthDay || !form.birthYear) {
      alert("Please provide a complete birthdate.");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired. Please log in again.");
        navigate("/");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/admin/teachers",
        {
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          password: form.password,
          gender: form.gender,
          birthMonth: Number(form.birthMonth),
          birthDay: Number(form.birthDay),
          birthYear: Number(form.birthYear),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Teacher account created successfully.");
      setForm({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        confirmPassword: "",
        gender: "",
        birthMonth: "",
        birthDay: "",
        birthYear: "",
      });
    } catch (error) {
      console.error("Failed to create teacher:", error);
      const message =
        error.response?.data?.message || "Failed to create teacher account.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header__title">
          <button className="link-btn" onClick={() => navigate(-1)}>
            &larr; Back
          </button>
          <div>
            <p className="admin-label">ADMINISTRATOR</p>
            <h1>Create Teacher Account</h1>
          </div>
        </div>
      </header>

      <main className="admin-main form-wrapper">
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              First Name
              <input
                type="text"
                name="firstname"
                value={form.firstname}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Last Name
              <input
                type="text"
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <div className="form-row">
            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            Gender
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <div className="form-row">
            <label>
              Birth Month
              <select
                name="birthMonth"
                value={form.birthMonth}
                onChange={handleChange}
                required
              >
                <option value="">Month</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Birth Day
              <select
                name="birthDay"
                value={form.birthDay}
                onChange={handleChange}
                required
              >
                <option value="">Day</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Birth Year
              <select
                name="birthYear"
                value={form.birthYear}
                onChange={handleChange}
                required
              >
                <option value="">Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary" onClick={() => navigate("/admin-home")}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Teacher"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminCreateTeacher;

