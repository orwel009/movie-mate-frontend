import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="app-footer mt-5">
      <div className="container py-3 d-flex flex-column flex-md-row justify-content-between align-items-center">

        <div className="footer-brand mb-2 mb-md-0">
          MovieMate <span className="year">© {new Date().getFullYear()}</span>
        </div>

        <div className="footer-links d-flex gap-3">
          <a href="/" className="footer-link">Home</a>
          <a href="/my-shows" className="footer-link">My Collection</a>
          <a href="/add" className="footer-link">Add</a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;