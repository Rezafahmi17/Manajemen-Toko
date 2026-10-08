# Manajemen Toko (TokoHub)

TokoHub is a Multi-Tenant Commerce Platform that provides a single place for shopping, renting, and managing stores. It unifies customer storefronts, transactions, inventory, payments, receipts, financial reports, and tenant dashboards into a simple experience.

## Features

- Multi-Tenant Architecture: Independent store data and management.
- Sales & Rentals: Support for direct product sales and flexible rental durations.
- Role-Based Access: Secure access for Admins, Cashiers, and Customers.
- Digital Receipts: Automated transaction recording and printable receipts.
- Real-time Reports: Financial insights and graphical charts for store owners.
- Cosmic & Cream UI: Modern, premium interface with high contrast and smooth animations.

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Authentication: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL

### Installation

1. Clone the repository.
2. Navigate to the backend directory and install dependencies:
   cd backend
   npm install

3. Navigate to the frontend directory and install dependencies:
   cd frontend
   npm install

### Configuration

1. In the backend directory, copy .env.example to .env and configure your database credentials and JWT secret.
2. Import the database schema from database.sql into your PostgreSQL database.

### Running the Application

1. Start the backend server:
   cd backend
   npm run dev

2. Start the frontend development server:
   cd frontend
   npm run dev

3. Open your browser and navigate to http://localhost:3000 to view the application.

## License

This project is licensed under the MIT License.
