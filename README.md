# Bitespeed Identity Reconciliation

## 🌐 Live API URL
https://bitespeed-identity-b71t.onrender.com

A REST API that identifies and links customer contacts across multiple purchases using **Node.js + TypeScript + MongoDB**.

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)

---

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd bitespeed-identity
npm install
```

### 2. Configure Environment

Open `.env` and paste your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/bitespeed?retryWrites=true&w=majority
PORT=3000
```

> **Free MongoDB:** Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), create a free cluster, and copy the connection string.

### 3. Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Server starts at **http://localhost:3000**

---

## 📡 API

### `POST /identify`

**Request Body:**
```json
{
  "email": "doc@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": "661f1e...",
    "emails": ["doc@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

## 🧪 Test with curl

```bash
# 1. Create first contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'

# 2. Shared phone → creates secondary contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}'

# 3. Merge two separate primaries
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"george@hillvalley.edu","phoneNumber":"717171"}'

curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"biffsucks@hillvalley.edu","phoneNumber":"919191"}'

curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"george@hillvalley.edu","phoneNumber":"919191"}'
```

---

## 🚀 Deployment (Render.com)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set environment variable: `MONGODB_URI` = your Atlas connection string
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
