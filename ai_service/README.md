# Heroku Deployment Project

This project is designed to deploy a Python-based gRPC server to Heroku. The server handles PDF extraction, chunking, and embedding, providing a robust solution for document processing.

## Project Structure

```
heroku-deployment-project
├── main.py            # Main application logic for the server
├── requirements.txt     # Python dependencies for the project
├── .gitignore           # Files and directories to ignore in Git
└── README.md            # Project documentation
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd heroku-deployment-project
   ```

2. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Server Locally**
   ```bash
   python server.py
   ```

## Deployment to Heroku

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a New Heroku App**
   ```bash
   heroku create <app-name>
   ```

3. **Deploy the Application**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push heroku master
   ```

4. **Open the Application**
   ```bash
   heroku open
   ```

## Usage

Once deployed, the server will be accessible via the Heroku app URL. You can interact with the gRPC services as defined in the `server.py` file.

## License

This project is licensed under the MIT License - see the LICENSE file for details.