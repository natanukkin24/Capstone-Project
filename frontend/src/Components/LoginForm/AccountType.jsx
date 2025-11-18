import { useContext, useEffect, useMemo } from "react";
import "../../styles/AccountType.css";
import { useNavigate } from "react-router-dom";
import { FaUserGraduate } from "react-icons/fa";
import { SignupContext } from "../../Context/UserSignupContext";

const AccountType = () => {
  const navigate = useNavigate();
  const [formdata, setFormdata] = useContext(SignupContext);

  useEffect(() => {
    console.log("Updated formdata:", formdata);
  }, [formdata]);

  const handleSelect = (accountType) => {
    setFormdata((prev) => ({ ...prev, accountType })); // update role safely
    navigate("/form");
  };

  const accountOptions = useMemo(
    () => [
      {
        type: "student",
        label: "Student",
        description: "Access quizzes, leaderboards, and classrooms.",
        icon: FaUserGraduate,
      },
      // Admin signup is available via a dedicated route and intentionally hidden here.
      // Re-enable by pushing an admin option into this array.
    ],
    []
  );

  return (
    <div className="accounttype-wrapper">
      <form>
        <p>SELECT ACCOUNT TYPE</p>
        <div className="accounttype-box-container">
          {accountOptions.map(({ type, label, description, icon: Icon }) => (
            <div
              key={type}
              className={`accounttype-box ${type}-box`}
              onClick={() => handleSelect(type)}
            >
              <Icon className="account-icon" />
              <span>{label}</span>
              <p className="accounttype-description">{description}</p>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
};

export default AccountType;
