import { createContext, useState } from "react";

export const QuizContext = createContext();

const QuizContextProvider = ({children}) => {
    const [formData, setFormData] = useState({
        title: "",
        lessonReference: "",
        description: "",
        difficulty: "",
        mode: "",
        map: "",
        classId: "", // later we’ll get this dynamically
    })
    return (  
        <QuizContext.Provider value={[formData ,setFormData]}>
            {children}
        </QuizContext.Provider>
    );
}
 
export default QuizContextProvider;