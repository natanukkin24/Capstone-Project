import React, { useState, useContext } from "react";
import { SignupContext } from "../../Context/UserSignupContext";
import { useNavigate } from "react-router-dom";

const PasswordPage = () => {
  const [formdata, setFormdata] = useContext(SignupContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleNext = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match! ❌");
      return;
    }

    // ✅ If passwords match, update context and navigate
    setFormdata({ ...formdata, email, password });
    console.log("Updated formdata:", { ...formdata, email,password });
    navigate('/verify-page');
  };

  return (
    <div className="signupwrapper">
      <form onSubmit={(e) => e.preventDefault()}>
        <h2>Create Email</h2>

        <div className="signupinput-box">
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <h2>Create Password</h2>

        <div className="signupinput-box">
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="signupinput-box">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="button" onClick={handleNext}>
          Next
        </button>
      </form>
    </div>
  );
};

export default PasswordPage;
