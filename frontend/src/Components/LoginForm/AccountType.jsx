import { useContext, useEffect } from "react";
import "../../styles/AccountType.css";
import { useNavigate } from "react-router-dom";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
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

  return (
    <div className="accounttype-wrapper">
      <form>
        <p>SELECT ACCOUNT TYPE</p>
        <div className="accounttype-box-container">
          <div
            className="accounttype-box student-box"
            onClick={() => handleSelect("student")}
          >
            <FaUserGraduate className="account-icon" />
            <span>Student</span>
          </div>
          <div
            className="accounttype-box teacher-box"
            onClick={() => handleSelect("teacher")}
          >
            <FaChalkboardTeacher className="account-icon" />
            <span>Teacher</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AccountType;
