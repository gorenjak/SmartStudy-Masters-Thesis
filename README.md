# SmartStudy

Prototype web application for research on adaptive user interfaces.

## Local Setup

1. Clone the repository.

2. In the `backend` directory:
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Create a `.env` file based on `.env.example`.
   - Start the backend:
     ```bash
     python app.py
     ```

3. In the `frontend` directory:
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the frontend:
     ```bash
     npm run dev
     ```

## Notes

- API keys, passwords, database connection strings are **not** included.
- Configure the required environment variables using the provided `.env.example` file.