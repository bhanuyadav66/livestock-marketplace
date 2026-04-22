# 🐄 Livestock Marketplace (AI-Powered)

A full-stack web application that enables users to **buy and sell livestock** (buffalo, goats, sheep, poultry, etc.) with modern features like **real-time chat, AI-powered recommendations, and location-based search**.

---

## 🚀 Live Demo

👉 https://livestock-marketplace-six.vercel.app/

---

## 📌 Features

### 👤 Authentication

* User signup & login (JWT-based)
* Secure password hashing
* Role-based access (User / Admin)

---

### 🐐 Livestock Listings

* Create, view, and manage listings
* Upload images (Cloudinary)
* Add details: price, age, description, location
* Category filtering (buffalo, goat, sheep, poultry)

---

### 📍 Location-Based Search

* Geo-based search using latitude & longitude
* Find animals near your location
* Radius-based filtering

---

### 💬 Real-Time Chat (Socket.IO)

* Buyer ↔ Seller communication
* Multi-buyer chat rooms
* Instant messaging (no refresh)
* Typing indicator
* Seen status
* Online/offline tracking

---

### 🤖 AI Features

* 🔍 AI-powered smart search
* 💡 Recommendation system (similar listings)
* 📊 Price prediction model (ML-based)

---

### ⭐ Ratings & Reviews

* Buyers can rate sellers
* Build trust in marketplace
* Prevent self-rating

---

### 🛠️ Admin Dashboard

* View platform analytics
* Manage users & listings
* Block/unblock users
* View reports
* Charts & insights

---

### 🎨 UI/UX

* Clean, modern UI (mobile-friendly)
* Dark mode support 🌙
* Loading skeletons
* Responsive design

---

## 🧱 Tech Stack

### Frontend

* Next.js 16
* React
* Tailwind CSS

### Backend

* Next.js API Routes
* Node.js

### Database

* MongoDB Atlas

### Real-Time

* Socket.IO (separate server on Render)

### AI / ML

* OpenAI API (AI search & chatbot)
* Scikit-learn (price prediction model)

### Cloud & Deployment

* Vercel (frontend + backend)
* Render (socket server)
* Cloudinary (image storage)

---

## ⚙️ Project Architecture

Frontend (Vercel)
↓
Next.js API (Backend)
↓
MongoDB Atlas (Database)
↓
Socket Server (Render)

---

## 🔧 Installation (Local Setup)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/livestock-marketplace.git
cd livestock-marketplace
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Add environment variables

Create `.env.local`:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
OPENAI_API_KEY=...
```

---

### 4. Run the app

```bash
npm run dev
```

---

## 🔌 Socket Server Setup

Navigate to socket server:

```bash
cd socket-server
npm install
npm start
```

---

## 🧪 Testing

* Open app in 2 browsers
* Login as buyer & seller
* Test:

  * Chat
  * Listings
  * Filters
  * Admin dashboard

---

## 📸 Screenshots

(Add your screenshots here)

---

## 🧠 Key Learnings

* Built scalable full-stack architecture
* Implemented real-time communication using WebSockets
* Designed AI-powered features
* Integrated cloud services (MongoDB, Cloudinary)
* Deployed production-ready system

---

## 🚀 Future Improvements

* Push notifications 🔔
* Payment integration 💳
* Advanced ML recommendation engine
* Mobile app version 📱

---

## 👨‍💻 Author

**Bunny Yadav**
Final Year CSE Student
Interested in AI, Data Science, and Full-Stack Development

---

## ⭐ If you like this project

Give it a ⭐ on GitHub — it helps a lot!
