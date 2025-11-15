import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";
import Add from "./pages/Add/Add";
import ProtectedRoute from "./components/ProtectedRoute";
import Edit from "./pages/Edit/Edit";
import MovieDetail from "./pages/MovieDetail/MovieDetail";
import AddedMovies from "./pages/AddedMovie/AddedMovies";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/catalog/:id" element={<MovieDetail routeSource="admin" />} />
        <Route path="/my-shows" element={<ProtectedRoute><AddedMovies/></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><Add/></ProtectedRoute>} />
        <Route path="/movie/:id" element={<ProtectedRoute><MovieDetail routeSource="movie"/></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><Edit/></ProtectedRoute>} />
        <Route path="*" element={<div><h1>Not Found</h1></div>} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
