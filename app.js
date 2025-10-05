import express from 'express';
import cors from 'cors';
// Import 'dotenv/config' to load your .env file automatically
import 'dotenv/config'; 
// This import will now work because chatbot.js is fixed
import { generate } from './chatbot.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Chatbot server is running!');
});

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'A valid "message" field is required.' });
    }

    try {
        console.log(`[Request] Received message: "${message}"`);
        const result = await generate(message);
        console.log(`[Response] Sending result: "${result}"`);
        res.json({ response: result });

    } catch (error) {
        console.error("An error occurred in the /chat endpoint:", error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
