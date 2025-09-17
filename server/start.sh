#!/bin/bash

# Multi-Dimensional Course Performance Analytics - Backend Startup Script

echo "🚀 Starting Course Performance Analytics Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip and try again."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Seed database
echo "🌱 Seeding database with sample data..."
python seed_data.py

# Start the server
echo "🎯 Starting FastAPI server..."
echo "📍 API will be available at: http://localhost:8000"
echo "📖 API Documentation: http://localhost:8000/docs"
echo "🔄 Press Ctrl+C to stop the server"
echo ""

python main.py
