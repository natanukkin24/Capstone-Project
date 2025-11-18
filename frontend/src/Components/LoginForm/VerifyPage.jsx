import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/VerifyPage.css";
import { SignupContext } from "../../Context/UserSignupContext";

const VerifyPage = () => {
  const navigate = useNavigate();
  const [formdata, setFormdata] = useContext(SignupContext);

  // Format birthdate for display as "Month, Day, Year"
  const formattedBirthdate = useMemo(() => {
    if (!formdata.birthdate) return "";
    
    let birthDate;
    // Handle both Date object and string formats
    if (formdata.birthdate instanceof Date) {
      birthDate = formdata.birthdate;
    } else if (typeof formdata.birthdate === 'string') {
      birthDate = new Date(formdata.birthdate);
    } else {
      return "";
    }

    // Check if date is valid
    if (isNaN(birthDate.getTime())) return "";

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const month = months[birthDate.getMonth()];
    const day = birthDate.getDate();
    const year = birthDate.getFullYear();

    return `${month} ${day}, ${year}`;
  }, [formdata.birthdate]);

  const handleCreateAccount = async () => {
    try {
      // Split the birthdate into parts (month/day/year)
      let birth;
      if (formdata.birthdate instanceof Date) {
        birth = formdata.birthdate;
      } else if (typeof formdata.birthdate === "string") {
        birth = new Date(formdata.birthdate);
      } else {
        alert("Please enter a valid birthdate.");
        return;
      }

      // Validate date
      if (isNaN(birth.getTime())) {
        alert("Please enter a valid birthdate.");
        return;
      }

      const payload = {
        firstname: formdata.firstname,
        lastname: formdata.lastname,
        birthMonth: birth.getMonth() + 1,
        birthDay: birth.getDate(),
        birthYear: birth.getFullYear(),
        gender: formdata.gender,
        gradeLevel: formdata.gradeLevel,
        section: formdata.section,
        email: formdata.email,
        password: formdata.password,
        accountType: formdata.accountType,
      };

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Account for ${formdata.accountType} created successfully!`);
        navigate("/");
      } else {
        alert(data.message || "Failed to register. Try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  if(formdata.accountType === "student"){
    return (
    <div className="information-student-form">
      <h2 className="firm-title">CONFIRM YOUR INFORMATION</h2>

      <input
        type="text"
        placeholder="First Name"
        value={formdata.firstname || ""}
        onChange={(e) => setFormdata({ ...formdata, firstname: e.target.value })}
        required
      />

      <input
        type="text"
        placeholder="Last Name"
        value={formdata.lastname || ""}
        onChange={(e) => setFormdata({ ...formdata, lastname: e.target.value })}
        required
      />

      <input
        type="text"
        value={formattedBirthdate}
        readOnly
        placeholder="Birthdate"
        style={{
          backgroundColor: "#f5f5f5",
          cursor: "not-allowed",
          color: "#333"
        }}
        required
      />

      <select
        value={formdata.gender || ""}
        onChange={(e) => setFormdata({ ...formdata, gender: e.target.value })}
        required
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <input
        type="text"
        placeholder="Grade Level"
        value={formdata.gradeLevel || ""}
        onChange={(e) => setFormdata({ ...formdata, gradeLevel: e.target.value })}
        required
      />

      <input
        type="text"
        placeholder="Section"
        value={formdata.section || ""}
        onChange={(e) => setFormdata({ ...formdata, section: e.target.value })}
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={formdata.email || ""}
        onChange={(e) => setFormdata({ ...formdata, email: e.target.value })}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={formdata.password || ""}
        onChange={(e) => setFormdata({ ...formdata, password: e.target.value })}
        required
      />

      <button type="button" onClick={handleCreateAccount}>
        Create Account
      </button>
    </div>
  );
  }

  if (formdata.accountType === "teacher") {
    return (
      <div className="information-teacher-form">
        <h2 className="firm-title">CONFIRM YOUR INFORMATION</h2>

        <input
          type="text"
          placeholder="First Name"
          value={formdata.firstname || ""}
          onChange={(e) =>
            setFormdata({ ...formdata, firstname: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Last Name"
          value={formdata.lastname || ""}
          onChange={(e) =>
            setFormdata({ ...formdata, lastname: e.target.value })
          }
          required
        />

        <input
          type="text"
          value={formattedBirthdate}
          readOnly
          placeholder="Birthdate"
          style={{
            backgroundColor: "#f5f5f5",
            cursor: "not-allowed",
            color: "#333",
          }}
          required
        />

        <select
          value={formdata.gender || ""}
          onChange={(e) => setFormdata({ ...formdata, gender: e.target.value })}
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <input
          type="email"
          placeholder="Email"
          value={formdata.email || ""}
          onChange={(e) => setFormdata({ ...formdata, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formdata.password || ""}
          onChange={(e) =>
            setFormdata({ ...formdata, password: e.target.value })
          }
          required
        />

        <button type="button" onClick={handleCreateAccount}>
          Create Account
        </button>
      </div>
    );
  }

  if (formdata.accountType === "admin") {
    return (
      <div className="information-teacher-form">
        <h2 className="firm-title">CONFIRM YOUR INFORMATION</h2>

        <input
          type="text"
          placeholder="First Name"
          value={formdata.firstname || ""}
          onChange={(e) =>
            setFormdata({ ...formdata, firstname: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Last Name"
          value={formdata.lastname || ""}
          onChange={(e) =>
            setFormdata({ ...formdata, lastname: e.target.value })
          }
          required
        />

        <input
          type="text"
          value={formattedBirthdate}
          readOnly
          placeholder="Birthdate"
          style={{
            backgroundColor: "#f5f5f5",
            cursor: "not-allowed",
            color: "#333",
          }}
          required
        />

        <select
          value={formdata.gender || ""}
          onChange={(e) => setFormdata({ ...formdata, gender: e.target.value })}
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <input
          type="email"
          placeholder="Email"
          value={formdata.email || ""}
          onChange={(e) => setFormdata({ ...formdata, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formdata.password || ""}
          onChange={(e) =>
            setFormdata({ ...formdata, password: e.target.value })
          }
          required
        />

        <button type="button" onClick={handleCreateAccount}>
          Create Account
        </button>
      </div>
    );
  }

  return null;
};

export default VerifyPage;
