import React, { useState } from "react";
import "./EmailPassword.css";

const EmailPassword = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  emailPlaceholder = "Email",
  passwordPlaceholder = "Password",
  showPasswordToggle = true,
  emailRequired = true,
  passwordRequired = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="email-password-container">
      <div className="input-box">
        <input
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={onEmailChange}
          required={emailRequired}
        />
      </div>

      <div className="input-box password-box">
        <input
          type={showPassword ? "text" : "password"}
          placeholder={passwordPlaceholder}
          value={password}
          onChange={onPasswordChange}
          required={passwordRequired}
        />
        {showPasswordToggle && (
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        )}
      </div>
    </div>
  );
};

export default EmailPassword;

