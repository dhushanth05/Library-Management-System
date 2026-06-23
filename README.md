# Library Management System

A comprehensive Library Management System built with HTML, CSS, JavaScript, Node.js, Express, and MongoDB Atlas.

Email: admin@library.com
Password: admin123

link to webstite - localhost:3000
`
node seed-books.js

## Features

- **Book Management**: Add, view, edit, and delete books
- **Member Management**: Register, view, and manage library members
- **Borrowing System**: Issue and return books
- **Advanced Search**: Search books by various parameters
- **Authentication & Authorization**: Different access levels for staff and members
- **Fine Calculation**: Automatic calculation of fines for overdue books

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
Library Management System/
├── models/             # MongoDB schemas
│   ├── Book.js
│   ├── Member.js
│   ├── Transaction.js
│   └── Fine.js
├── routes/             # API routes
│   ├── authRoutes.js
│   ├── bookRoutes.js
│   ├── memberRoutes.js
│   ├── transactionRoutes.js
│   └── fineRoutes.js
├── middleware/         # Middleware functions
│   └── auth.js
├── public/             # Frontend files
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── dashboard.js
│   │   ├── fines.js
│   │   ├── main.js
│   │   ├── members.js
│   │   ├── reports.js
│   │   ├── settings.js
│   │   └── transactions.js
│   └── index.html
├── .env                # Environment variables
├── package.json        # Project dependencies
├── server.js           # Main server file
└── README.md           # Project documentation
```

## Setup Instructions

1. **Clone the repository**

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     MONGODB_URI=your_mongodb_atlas_connection_string
     PORT=3000
     JWT_SECRET=your_jwt_secret_key
     ```

4. **Start the server**
   ```
   npm start
   ```
   or for development:
   ```
   npm run dev
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## User Roles

1. **Admin**
   - Full access to all features
   - Can manage librarians and members
   - Can generate reports

2. **Librarian**
   - Can manage books and members
   - Can issue and return books
   - Can manage fines

3. **Member**
   - Can view available books
   - Can view their borrowing history
   - Can view their fines

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new member
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Books
- `GET /api/books` - Get all books
- `GET /api/books/search` - Advanced search for books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Add a new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Members
- `GET /api/members` - Get all members
- `GET /api/members/search` - Search for members
- `GET /api/members/:id` - Get member by ID
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `PUT /api/members/:id/change-password` - Change member password

### Transactions
- `POST /api/transactions/borrow` - Borrow a book
- `PUT /api/transactions/:id/return` - Return a book
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/member/:memberId` - Get transactions for a specific member
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id/extend` - Extend due date
- `GET /api/transactions/status/overdue` - Get all overdue transactions
- `GET /api/transactions/calculate-fines` - Calculate fines for overdue books

### Fines
- `GET /api/fines` - Get all fines
- `GET /api/fines/member/:memberId` - Get fines for a specific member
- `GET /api/fines/:id` - Get fine by ID
- `PUT /api/fines/:id/pay` - Mark fine as paid
- `PUT /api/fines/:id/waive` - Waive a fine
- `GET /api/fines/stats/summary` - Get summary statistics of fines

## License

This project is licensed under the MIT License.
