# **MovieMate — Frontend (React)**

This is the **React frontend** for **MovieMate**, an application for tracking movies and TV shows.  
It includes authentication, listing, filtering, progress tracking, rating, reviews, and interacts with a Django REST API backend.

---

## **Features**
- User authentication (login and signup)
- List all movies and TV shows
- Search and filter by genre, platform, and status
- Add new movie or TV show
- Create custom movie or TV show
- Edit movie/show details
- Track TV show progress (episodes watched)
- Add rating and review
- Delete entries
- API integration using Axios

---

## **Tech Stack**
- React (Create React App)
- React Router
- Axios
- CSS / Bootstrap

---

## **Setup Instructions**

### **1. Clone the repository**
```bash
git clone https://github.com/orwel009/movie-mate-frontend.git
cd movie-mate-frontend
```

### **2. Install dependencies**
```bash
npm install
```

### **3. Create `.env` file**
Create a file named `.env` in the root of the frontend:
```bash
REACT_APP_API_BASE=http://localhost:8000
```

### **4. Start the development server**
```bash
npm start
```

Runs at:
```
http://localhost:3000
```

---



## **Project Structure**
```
src/
  api.js
  pages/
    Auth/
      Login.jsx
      Signup.jsx
    Home/Home.jsx
    Add/Add.jsx
    Edit/Edit.jsx
    MovieDetail/MovieDetail.js
    AddedMovie/AddedMovie.jsx
    Profile/Profile.jsx
  components/
    MovieCard/MovieCard.js
    FilterBar/FilterBar.jsx
    Pagination/Pagination.jsx
    Footer/Footer.jsx
    ProtectedRoute.js
  App.js
  index.js
```

---

## **Build for Production**
```bash
npm run build
```

---

## **Author**
**ORWEL P V**