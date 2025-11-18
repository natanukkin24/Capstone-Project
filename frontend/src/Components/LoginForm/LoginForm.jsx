import React, { useState } from "react";
import "../../styles/LoginForm.css";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // The backend should return:
      // { token, user: { _id, email, role, ... } }
      const { token, user } = data;

      // Save auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert(`Welcome back, ${user.firstName || "User"}!`);

      // Redirect by role
      if (user.role === "teacher") {
        navigate("/teacher-home");
      } else if (user.role === "student") {
        navigate("/student-home");
      } else if (user.role === "admin") {
        navigate("/admin-home");
      } else {
        navigate("/"); // fallback
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error:", err);
      alert("An error occurred during login.");
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <h1>LOGIN</h1>

        <div className="input-box">
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-box password-box">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {isLoading && <p className="loading-text">Logging in...</p>}

        <div className="button-container">
          <div className="button-group">
            <button type="submit" className="login-button" disabled={isLoading}>
              LOG IN
            </button>
            <div className="or-separator">OR</div>
            <button
              type="button"
              className="signup-button"
              onClick={() => navigate("/account-type")}
            >
              SIGN UP
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
