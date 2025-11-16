import React, { useEffect ,useState, useContext } from "react";
import "../../styles/SignupForm.css";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaFacebookF, FaInstagram } from "react-icons/fa";
import { SignupContext } from "../../Context/UserSignupContext";


const SignupForm = () => {
  const navigate = useNavigate();
  const [formdata, setFormdata ] = useContext(SignupContext)
  const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
      console.log("Updated formdata:", formdata);
    }, [formdata]);
  

  return (
    <div className="signupwrapper">
      <form>
        <h2>SIGN UP</h2>
        <div className="signupinput-box">
          <input 
          type="text" 
          placeholder="Email" 
          required
          onChange={(e) => setFormdata({...formdata, email: e.target.value})} />
        </div>
        <div className="signupinput-box password-box">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            onChange={(e) => setFormdata({...formdata, password: e.target.value})} 
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "👁️" :"🙈" }
          </span>
        </div>

        <div className="signupbutton-container">
          <div className="signupbutton-group">
            <button
              type="button"
              className="signup-button"
              onClick={() => {
                navigate("/account-type")
              }
              }
            >
              SIGN UP
            </button>
          </div>
        </div>
      </form>


        <div className="or-separator2">OR</div>
            <div className="social-icons">
              <FaGoogle className="icon google" />
              <FaFacebookF className="icon facebook" />
              <FaInstagram className="icon instagram" />
        </div>


        <div className="accept-terms">
              <label>
                By signing up, you accept our Terms and Conditions. Please read
                our Privacy Notice.
              </label>
        </div>

      
    </div>
  );
};

export default SignupForm;
