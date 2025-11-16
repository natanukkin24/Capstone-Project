// App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./Components/LoginForm/LoginForm";
import AccountType from "./Components/LoginForm/AccountType";
import Form from "./Components/LoginForm/Form";
import PasswordPage from "./Components/LoginForm/PasswordPage";
import VerifyPage from "./Components/LoginForm/VerifyPage";
import StudentHome from "./Components/LoginForm/StudentHome";
import Shop from "./Components/LoginForm/Shop";
import JoinClass from "./Components/LoginForm/JoinClass";
import MyClass from "./Components/LoginForm/MyClass";
import Settings from "./Components/LoginForm/Settings";
import StudentClass from "./Components/LoginForm/StudentClass";
import SetProfile from "./Components/LoginForm/SetProfile";
import CharacterSelection from "./Components/LoginForm/CharacterSelection";
import Leaderboards from "./Components/LoginForm/Leaderboards";
import JoinGame from "./Components/LoginForm/JoinGame";
import Lobby from "./Components/LoginForm/Lobby";
import TeacherMyClass from "./Components/LoginForm/TeacherMyClass";
// import TeacherViewClass from "./Components/LoginForm/TeacherViewClass";
import ViewStudents from "./Components/LoginForm/ViewStudents";
import TeacherLeaderboards from "./Components/LoginForm/TeacherLeaderboards";
import MyQuizzes from "./Components/LoginForm/MyQuizzes";
import CreateClassTeacher from "./Components/LoginForm/CreateClassTeacher";
import TeacherHome from "./Components/LoginForm/TeacherHome";
import ProtectedRoute from "./Components/LoginForm/ProtectedRoute";
import CreateQuiz from "./Components/LoginForm/CreateQuiz";
import GameMode from "./Components/LoginForm/GameMode";
import MapSelection from "./Components/LoginForm/QuestionTypes/MapSelection";
import StudentClassroom from "./Components/LoginForm/StudentClassroom";
import Classroom from "./Components/LoginForm/Classroom";
import ViewClass from "./Components/LoginForm/ViewClass";
import Classmates from "./Components/LoginForm/Classmates";
//Context Provider
import SignupContextProvider from "./Context/UserSignupContext";
import QuizContextProvider from "./Context/QuizContext";
import QuizQuestions from "./Components/LoginForm/QuestionTypes/QuizQuestions";
import Game from "./Components/LoginForm/Game";


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <SignupContextProvider>
        <QuizContextProvider>
          <Routes>
            {/* 🔓 Public Routes */}
            <Route path="/" element={<LoginForm />} />
            <Route path="/account-type" element={<AccountType />} />
            <Route path="/form" element={<Form />} />
            <Route path="/email&password" element={<PasswordPage />} />
            <Route path="/verify-page" element={<VerifyPage />} />

            {/* 🧑‍🎓 Student Protected Routes */}
            <Route
              path="/student-home"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <Shop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join-class"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <JoinClass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-class"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <MyClass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["student" , "teacher"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/set-profile"
              element={
                <ProtectedRoute allowedRoles={["student" , "teacher"]}>
                  <SetProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/character-selection"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <CharacterSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view-class/:classId"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <ViewClass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view-class/:classId/classmates"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <Classmates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view-class/:classId/leaderboards"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <Leaderboards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join-game/:classId"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <JoinGame />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lobby/:quizId"
              element={
                <ProtectedRoute allowedRoles={["student","teacher"]}>
                  <Lobby />
                </ProtectedRoute>
              }
            />

            {/* 👩‍🏫 Teacher Protected Routes */}
            <Route
              path="/teacher-home"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-class-teacher"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <CreateClassTeacher />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-class-teacher"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherMyClass />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/view-class-teacher"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherViewClass />
                </ProtectedRoute>
              }
            /> */}
              <Route
              path="/view-students/:classId"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <ViewStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classroom/:classId"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <Classroom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboards/:classId"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherLeaderboards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/select-gamemode/:classId"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <GameMode />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/select-maps"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <Maps />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/create-quiz/:classId"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <CreateQuiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-quizzes/:classId"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <MyQuizzes />
                </ProtectedRoute>
              }
            />

              {/* <Route path="/create-quiz/:classId/multiple-choice" element={
                <MultipleChoice 
                />} />
              <Route path="/create-quiz/:classId/true-or-false" element={
                <TrueOrFalse />
                } />
              <Route path="/create-quiz/:classId/fill-in-the-blank" element={
                <FillInTheBlank />
                } /> */}
              <Route path="/create-quiz/:classId/create-questions" allowedRoles={["teacher"]} element={
                <QuizQuestions />
                } />
              <Route path="/select-map/:classId/:quizId" allowedRoles={["teacher"]} element={
                <MapSelection />
                } />
            <Route
              path="/game/:quizId"
              element={
                <ProtectedRoute allowedRoles={["student", "teacher"]}>
                  <Game />
                </ProtectedRoute>
              }
            />


          </Routes>

          

        </QuizContextProvider>
        </SignupContextProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
