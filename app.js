import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import 'dotenv/config';
import { generate } from './chatbot.js';

const app = express();
const port = process.env.PORT || 3001;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, 'frontend')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

//this line  handle chat requests
app.post('/chat', async (req, res) => {

    const { message } = req.body;

    // basic input check
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
            error: 'A valid message is required.'
        });
    }

    try {

        console.log(`[User] ${message}`);

        // generate AI reply
        const result = await generate(message);

        console.log(`[AI] ${result}`);

        res.json({ response: result });

    } catch (error) {

        console.error('Something went wrong:', error);

        res.status(500).json({
            error: 'Internal server error'
        });
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});