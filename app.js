import express from 'express'; // Import Express framework
import cors from 'cors'; // Import CORS middleware
import path from 'path'; // Import path module
import { fileURLToPath } from 'url'; // Required for __dirname in ES modules

// Load environment variables from .env file
import 'dotenv/config';

// Import AI response generation function
import { generate } from './chatbot.js';

// Create Express application
const app = express();

// Use PORT from environment or default to 3001
const port = process.env.PORT || 3001;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS for frontend-backend communication
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

/**
 * Serve frontend static files
 */
app.use(express.static(path.join(__dirname, 'frontend')));

/**
 * Home route
 * Serves frontend index.html
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

/**
 * Chat endpoint
 * Receives user message and returns AI response
 */
app.post('/chat', async (req, res) => {

    // Extract message from request body
    const { message } = req.body;

    // Validate message input
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
            error: 'A valid "message" field is required.'
        });
    }

    try {

        // Log incoming user message
        console.log(`[Request] Received message: "${message}"`);

        // Generate AI response
        const result = await generate(message);

        // Log AI response
        console.log(`[Response] Sending result: "${result}"`);

        // Send response back to frontend
        res.json({ response: result });

    } catch (error) {

        // Handle server or AI errors
        console.error("An error occurred in the /chat endpoint:", error);

        res.status(500).json({
            error: 'An internal server error occurred.'
        });
    }
});

/**
 * Start server
 */
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});