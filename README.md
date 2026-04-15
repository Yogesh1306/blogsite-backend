# 📝 BlogSite Backend

A production-ready RESTful API backend for a full-featured blogging platform. Built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, it supports JWT-based authentication, Google OAuth, role-based access control, image uploads via ImageKit, and real-time post visit tracking.

---

## 🚀 Features

- **Authentication & Authorization**
  - Register & Login with bcrypt password hashing
  - JWT Access Token + Refresh Token strategy
  - Google OAuth 2.0 via [Arctic](https://arcticjs.dev/)
  - Role-based access control (`admin` / `user`)
  - HTTP-only cookie-based token management

- **Posts**
  - Create, Read, Update, Delete blog posts
  - Slug-based post retrieval
  - Featured post management (admin only)
  - Post visit count tracking via middleware
  - Secure image uploads using ImageKit authentication endpoint

- **Comments**
  - Add and delete comments on posts
  - Fetch all comments for a post

- **User Management**
  - Get current authenticated user profile
  - Save / unsave posts (bookmarks)
  - Retrieve saved posts
  - Delete account

---

## 🛠️ Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Runtime       | Node.js (ES Modules)              |
| Framework     | Express.js v5                     |
| Database      | MongoDB + Mongoose v9             |
| Authentication| JWT (jsonwebtoken), bcrypt        |
| OAuth         | Arctic v3 (Google OAuth 2.0)      |
| Image Uploads | ImageKit Node.js SDK              |
| Dev Tools     | Nodemon                           |
| Other         | cookie-parser, cors, dotenv       |

---

## 📁 Project Structure

```
    blogsite-backend/
├── src/
│ ├── config/ # App configuration (ImageKit, OAuth, etc.)
│ ├── controllers/ # Route handler logic
│ │ ├── user.controllers.js
│ │ ├── post.controllers.js
│ │ └── comment.controllers.js
│ ├── db/ # MongoDB connection
│ ├── middleware/ # Auth, error handling, visit counter
│ │ ├── auth.middleware.js
│ │ ├── error.middleware.js
│ │ └── visitCount.middleware.js
│ ├── models/ # Mongoose schemas
│ │ ├── user.model.js
│ │ ├── post.model.js
│ │ └── comment.model.js
│ ├── routes/ # Express routers
│ │ ├── user.routes.js
│ │ ├── post.routes.js
│ │ └── comment.routes.js
│ ├── utils/ # Utility/helper functions
│ ├── app.js # Express app setup
│ ├── constants.js # App-wide constants
│ └── index.js # Server entry point
├── .gitignore
├── package.json
└── README.md
```

---

## 📡 API Reference

### Auth / User Routes — `/api/users`

| Method   | Endpoint             | Auth Required | Description                          |
|----------|----------------------|:-------------:|--------------------------------------|
| `POST`   | `/register`          | ❌            | Register a new user                  |
| `POST`   | `/login`             | ❌            | Login and receive JWT tokens         |
| `GET`    | `/google`            | ❌            | Redirect to Google OAuth login       |
| `GET`    | `/google/callback`   | ❌            | Google OAuth callback handler        |
| `POST`   | `/logout`            | ✅            | Logout and clear tokens              |
| `GET`    | `/`                  | ✅            | Get current user profile             |
| `DELETE` | `/`                  | ✅            | Delete current user account          |
| `GET`    | `/savedPosts`        | ✅            | Get user's saved/bookmarked posts    |
| `PATCH`  | `/save`              | ✅            | Save or unsave a post                |

### Post Routes — `/api/posts`

| Method   | Endpoint                   | Auth Required | Description                        |
|----------|----------------------------|:-------------:|------------------------------------|
| `GET`    | `/upload-auth`             | ❌            | Get ImageKit upload auth signature |
| `GET`    | `/`                        | ❌            | Get all posts (with filters)       |
| `GET`    | `/:slug`                   | ❌            | Get a single post by slug          |
| `POST`   | `/`                        | ✅            | Create a new post                  |
| `PATCH`  | `/:id`                     | ✅            | Update a post                      |
| `DELETE` | `/:id`                     | ✅            | Delete a post                      |
| `PATCH`  | `/feature/feature-post`    | ✅ (admin)    | Mark/unmark a post as featured     |

### Comment Routes — `/api/comments`

| Method   | Endpoint         | Auth Required | Description                  |
|----------|------------------|:-------------:|------------------------------|
| `GET`    | `/:postId`       | ❌            | Get all comments for a post  |
| `POST`   | `/:postId`       | ✅            | Add a comment to a post      |
| `DELETE` | `/:commentId`    | ✅            | Delete a comment             |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
CLIENT_URL=your_client_url

# Database
MONGODB_URI=your_mongodb_uri

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/users/google/callback

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

---

## 🏃 Getting Started

### Prerequisites

- Node.js >= 18.x
- MongoDB Atlas account or local MongoDB instance
- ImageKit account
- Google Cloud Console project (for OAuth)

### Installation

```bash
# Clone the repository
git clone https://github.com/Yogesh1306/blogsite-backend.git
cd blogsite-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values in .env

# Start the development server
npm run dev
```

The server will start at `http://localhost:3000`.

---

## 🗄️ Data Models

### User
| Field              | Type       | Notes                            |
|--------------------|------------|----------------------------------|
| `username`         | String     | Unique, required                 |
| `email`            | String     | Unique, required                 |
| `password`         | String     | Hashed with bcrypt (optional for OAuth users) |
| `avatar`           | String     | Profile image URL                |
| `role`             | String     | `"user"` (default) or `"admin"`  |
| `provider`         | String     | `"google"` or `"github"`         |
| `providerAccountId`| String     | OAuth provider account ID        |
| `savedPosts`       | [String]   | Array of saved post IDs          |
| `refreshToken`     | String     | Stored refresh token             |

### Post
| Field        | Type      | Notes                         |
|--------------|-----------|-------------------------------|
| `user`       | ObjectId  | Ref → User (required)         |
| `title`      | String    | Required                      |
| `slug`       | String    | Unique, required              |
| `desc`       | String    | Short description             |
| `content`    | String    | Full post body (required)     |
| `coverImg`   | String    | ImageKit URL                  |
| `category`   | String    | Default: `"general"`          |
| `isFeatured` | Boolean   | Default: `false`              |
| `visits`     | Number    | Auto-incremented on each view |

### Comment
| Field   | Type     | Notes              |
|---------|----------|--------------------|
| `post`  | ObjectId | Ref → Post         |
| `user`  | ObjectId | Ref → User         |
| `desc`  | String   | Comment content    |

---

## 🔐 Authentication Flow

1. **Register/Login** → Server returns `accessToken` (short-lived) and `refreshToken` (long-lived) as HTTP-only cookies.
2. **Protected routes** → `jwtAuth` middleware validates the `accessToken` from the cookie.
3. **Google OAuth** → User is redirected to `/api/users/google` → Google → `/api/users/google/callback` → tokens issued.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Yogesh Joshi**
- GitHub: [@Yogesh1306](https://github.com/Yogesh1306)