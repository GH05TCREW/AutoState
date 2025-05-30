#!/bin/bash

echo "Starting AutoState..."
echo ""
echo "Make sure you have:"
echo "1. Python virtual environment activated"
echo "2. .env file configured in backend folder"
echo "3. Dependencies installed (pip install -r requirements.txt, npm install)"
echo ""

# Start backend
echo "Starting Backend Server..."
(cd backend && python main.py) &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend
echo "Starting Frontend Server..."
(cd frontend && npm start) &
FRONTEND_PID=$!

echo ""
echo "AutoState is starting!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 