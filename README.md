# FreelanceHub - Full Stack Platform

A modern platform connecting clients with skilled freelancers, built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Dual User Types**: Separate dashboards for freelancers and clients
- **Freelancer Profiles**: Complete profiles with skills, rates, portfolio, and availability
- **Job Posting**: Clients can post jobs with budgets and required skills
- **Contact Requests**: Clients can request contact with freelancers
- **Job Applications**: Freelancers can apply to posted jobs
- **Connections**: Secure contact information exchange between matched parties
- **Search & Filter**: Find freelancers by name, skills, or other criteria

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- Vanilla JavaScript
- Tailwind CSS
- Font Awesome icons

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/freelancehub
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

**Important**: 
- For local MongoDB: Use `mongodb://localhost:27017/freelancehub`
- For MongoDB Atlas: Use your connection string from Atlas dashboard
- Change `JWT_SECRET` to a strong, random string in production

### 3. Start MongoDB

**Local MongoDB:**
```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**MongoDB Atlas:**
- No local setup needed, just use your Atlas connection string in `.env`

### 4. Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

### 5. Open the Frontend

Simply open `main.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000
```

Then navigate to `http://localhost:8000/main.html`

## Project Structure

```
FreeLancer/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (create this)
├── .gitignore               # Git ignore file
├── main.html                 # Frontend application
├── api.js                    # API utility functions
├── models/                   # MongoDB models
│   ├── User.js
│   ├── Job.js
│   ├── ContactRequest.js
│   ├── JobApplication.js
│   └── Connection.js
├── routes/                   # API routes
│   ├── auth.js
│   ├── users.js
│   ├── jobs.js
│   ├── contactRequests.js
│   ├── jobApplications.js
│   └── connections.js
└── middleware/              # Custom middleware
    └── auth.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users/freelancers` - Get all freelancers (with search/filter)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile (protected)

### Jobs
- `GET /api/jobs` - Get all open jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job (protected, client only)
- `GET /api/jobs/client/my-jobs` - Get client's jobs (protected)

### Contact Requests
- `POST /api/contact-requests` - Create contact request (protected, client only)
- `GET /api/contact-requests/freelancer/my-requests` - Get freelancer's requests (protected)
- `GET /api/contact-requests/client/my-requests` - Get client's requests (protected)
- `POST /api/contact-requests/:id/accept` - Accept contact request (protected, freelancer only)

### Job Applications
- `POST /api/job-applications` - Apply to job (protected, freelancer only)
- `GET /api/job-applications/freelancer/my-applications` - Get freelancer's applications (protected)

### Connections
- `GET /api/connections/my-connections` - Get user's connections (protected)
- `GET /api/connections/:id` - Get connection by ID (protected)

## Database Schema

### User
- name, email, password, phone, type (freelancer/client)
- profile (nested object with different fields for freelancers/clients)

### Job
- clientId, clientName, title, description, budget, skills, status

### ContactRequest
- clientId, clientName, clientEmail, clientPhone
- freelancerId, summary, budget, timeline, status

### JobApplication
- jobId, jobTitle, freelancerId, freelancerName, clientId, status

### Connection
- clientId, clientName, clientEmail, clientPhone
- freelancerId, freelancerName, freelancerEmail, freelancerPhone
- requestId, status

## Seed Demo Data

To populate the database with demo users, freelancers, clients, and jobs:

```bash
npm run seed
```

This will create:
- 8 demo freelancers with complete profiles
- 4 demo clients with company profiles
- 8 demo jobs posted by clients
- Sample contact requests and connections

**Demo Account Credentials:**
- Email: `sarah.johnson@email.com` (Freelancer)
- Email: `contact@techstart.com` (Client)
- Password: `password123` (for all demo accounts)

## Usage

1. **Register**: Create an account as either a freelancer or client
2. **Login**: Access your dashboard (or use demo accounts)
3. **Freelancers**: Complete your profile, view contact requests, apply to jobs
4. **Clients**: Post jobs, browse freelancers, send contact requests
5. **Connections**: When a freelancer accepts a contact request, contact info is exchanged

## Security Features

- Passwords are hashed using bcryptjs
- JWT tokens for secure authentication
- Protected routes require valid authentication
- User type validation (clients can't post jobs, etc.)

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally, or
- Check your MongoDB Atlas connection string
- Verify the database name in MONGODB_URI

### CORS Issues
- The backend is configured to accept requests from any origin
- If issues persist, check the CORS configuration in `server.js`

### Port Already in Use
- Change the PORT in `.env` file
- Or kill the process using port 5000

## Production Deployment

Before deploying to production:

1. Change `JWT_SECRET` to a strong, random string
2. Set `NODE_ENV=production`
3. Use a production MongoDB instance (MongoDB Atlas recommended)
4. Update `API_BASE_URL` in `api.js` to your production backend URL
5. Enable HTTPS
6. Set up proper error logging
7. Configure environment variables on your hosting platform

## License

ISC

## Support

For issues or questions, please check the code comments or create an issue in the repository.

