import "../../styles/AccountTypeStudent.css";
import "../../styles/AccountTypeTeacher.css";
import { useNavigate } from "react-router-dom";
import { SignupContext } from "../../Context/UserSignupContext";
import { useContext, useEffect } from "react"; // <-- Import useEffect

const Form = () => {
  const navigate = useNavigate();
  const [formdata, setFormdata] = useContext(SignupContext);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from(
    { length: 30 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Function to handle the change for all date selectors
  const handleDateChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
    // navigate("/form")
  };

 // ... (imports and component setup)

  useEffect(() => {
    const { month, day, year } = formdata;
    // Check if all three values exist
    if (month && day && year) {
      // Create a new Date object. Month is 0-indexed, so we use the index value.
      const combinedDate = new Date(year, month, day);

      // Create a new object that includes the previous state,
      // but explicitly overwrites the date-related fields.
      const updatedFormData = {
        ...formdata,
        birthdate: combinedDate,
      };

      // Delete the month, day, and year keys from the new object
      delete updatedFormData.month;
      delete updatedFormData.day;
      delete updatedFormData.year;

      // Update the state with the new, clean object
      setFormdata(updatedFormData);
    }
  }, [formdata.month, formdata.day, formdata.year]); // Depend on individual date values

// ... (rest of the component)
  const handleGenderChange = (e) => {
    setFormdata({ ...formdata, gender: e.target.value });
  };

  if(!formdata.accountType){
    return (
      <div className="accounttype-student-form">
        <h2 className="form-title">PLEASE SELECT AN ACCOUNT TYPE FIRST.</h2>
      </div>
    );
  }

  if(formdata.accountType === "student"){
    return(
    <form className="accounttype-student-form">
      <h2 className="form-title">ACCOUNT TYPE: {formdata.accountType.toUpperCase()}</h2>
      <input
        type="text"
        placeholder="First Name"
        onChange={(e) => setFormdata({ ...formdata, firstname: e.target.value })}
      />
      <input
        type="text"
        placeholder="Last Name"
        onChange={(e) => setFormdata({ ...formdata, lastname: e.target.value })}
      />
      <div className="birthdate-group">
        <select name="month" onChange={handleDateChange}>
          <option value="">Month</option>
          {months.map((month, idx) => (
            <option key={idx} value={idx}>
              {month}
            </option>
          ))}
        </select>
        <select name="day" onChange={handleDateChange}>
          <option value="">Day</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <select name="year" onChange={handleDateChange}>
          <option value="">Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <select name="gradeLevel" 
      onChange={(e) => setFormdata({...formdata, gradeLevel: e.target.value})}
      >
        <option value="">Grade Level</option>
        <option value="Grade 4">Grade 4</option>
        <option value="Grade 5">Grade 5</option>
        <option value="Grade 6">Grade 6</option>
      </select>
      <input
        type="text"
        placeholder="Enter Class Section"
        onChange={(e) => setFormdata({ ...formdata, section: e.target.value })}
      />
      <select name="gender" onChange={handleGenderChange}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <button type="button" onClick={() =>{
        console.log(formdata) 
        navigate("/email&password")}}>
        Next
      </button>
    </form>
  );
  }

  if (formdata.accountType === "teacher") {
    return(
    <form className="accounttype-teacher-form">
      <h2 className="form-title">ACCOUNT TYPE: {formdata.accountType.toUpperCase()}</h2>
      <input
        type="text"
        placeholder="First Name"
        onChange={(e) => setFormdata({ ...formdata, firstname: e.target.value })}
      />
      <input
        type="text"
        placeholder="Last Name"
        onChange={(e) => setFormdata({ ...formdata, lastname: e.target.value })}
      />
      <div className="birthdate-group">
        <select name="month" onChange={handleDateChange}>
          <option value="">Month</option>
          {months.map((month, idx) => (
            <option key={idx} value={idx}>
              {month}
            </option>
          ))}
        </select>
        <select name="day" onChange={handleDateChange}>
          <option value="">Day</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <select name="year" onChange={handleDateChange}>
          <option value="">Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <select name="gender" onChange={handleGenderChange}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <button type="button" onClick={() =>{
        console.log(formdata) 
        navigate("/email&password")}}>
        Next
      </button>
    </form>
    )
  }

  if (formdata.accountType === "admin") {
    return (
      <form className="accounttype-admin-form">
        <h2 className="form-title">
          ACCOUNT TYPE: {formdata.accountType.toUpperCase()}
        </h2>
        <input
          type="text"
          placeholder="First Name"
          onChange={(e) =>
            setFormdata({ ...formdata, firstname: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Last Name"
          onChange={(e) =>
            setFormdata({ ...formdata, lastname: e.target.value })
          }
        />
        <div className="birthdate-group">
          <select name="month" onChange={handleDateChange}>
            <option value="">Month</option>
            {months.map((month, idx) => (
              <option key={idx} value={idx}>
                {month}
              </option>
            ))}
          </select>
          <select name="day" onChange={handleDateChange}>
            <option value="">Day</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <select name="year" onChange={handleDateChange}>
            <option value="">Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <select name="gender" onChange={handleGenderChange}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <button
          type="button"
          onClick={() => {
            console.log(formdata);
            navigate("/email&password");
          }}
        >
          Next
        </button>
      </form>
    );
  }

  return null;
};

export default Form;