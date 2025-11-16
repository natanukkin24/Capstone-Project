import { createContext, useState } from "react";

export const SignupContext = createContext();

const SignupContextProvider = ({children}) => {
    const [formdata, setFormData] = useState({
        email: "",
        password: "",
        firstname: "",
        lastname:"",
        accountType:"",
        section:"",
        birthdate: "",
        gender: "",
        gradeLevel: ""
    })
    return (  
        <SignupContext.Provider value={[formdata ,setFormData]}>
            {children}
        </SignupContext.Provider>
    );
}
 
export default SignupContextProvider;