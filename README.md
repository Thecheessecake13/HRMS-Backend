# HRMS Lite - Backend

This is the backend API for the HRMS Lite system, built with Node.js and Express.

## 🚀 Tech Stack

- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Validation**: [express-validator](https://express-validator.github.io/docs/)
- **Rate Limiting**: [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- **Deployment**: Configured for [Vercel](https://vercel.com/)

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)

### Installation

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration

Create a `.env` file in the `backend` directory and add the following:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5001
NODE_ENV=development
```

### Running the Server

- **Development mode** (with hot reload):
    ```bash
    npm run dev
    ```
- **Production mode**:
    ```bash
    npm start
    ```

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check |
| `GET/POST` | `/api/employees` | Manage employees |
| `GET/PUT/DELETE` | `/api/employees/:id` | Specific employee operations |
| `GET/POST` | `/api/attendance` | Track attendance |
| `GET` | `/api/activity` | Fetch activity logs |
| `PATCH` | `/api/activity/mark-read` | Mark logs as read |

## 📁 Directory Structure

- `index.js`: Main entry point and middleware configuration.
- `models/`: Mongoose schemas for data entities.
- `routes/`: Express route definitions.
- `vercel.json`: Configuration for Vercel deployment.
