import Groq from 'groq-sdk';
import { tavily } from '@tavily/core';

// --- SETUP ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

// --- TOOL DEFINITION ---
async function webSearch({ query }) {
    console.log(`🔎 Calling web search tool with query: "${query}"`);
    try {
        const response = await tvly.search(query, { maxResults: 5 });
        // Return a simple, formatted string for the model to process
        return response.results.map(r => `Title: ${r.title}\nContent: ${r.content}`).join('\n\n');
    } catch (error) {
        console.error("Error during Tavily search:", error);
        return "Error searching the web.";
    }
}

// --- MAIN LOGIC ---
export async function generate(userMessage) {
    const messages = [
        {
            role: 'system',
            // --- IMPROVED INSTRUCTIONS ---
            // This new prompt clearly separates conversational answers from tool use.
            content: `You are a friendly and conversational AI assistant. Your goal is to chat like a real person.

            **Your Personality:**
            - Be friendly, direct, and helpful.
            - Keep your answers short and to the point for simple greetings and questions. A one-sentence reply is often best.
            - Only provide detailed, multi-paragraph answers when the user specifically asks for a complex explanation.

            **How to Behave:**
            - **IF the user says "hi" or "hello":** Respond with a simple, casual greeting like "Hey there!" or "Hello! How can I help?".
            - **IF the user asks a simple question:** Give a direct, simple answer.
            - **IF the user asks for complex information (like news, weather, or "what is a black hole?"):** Then it's okay to use your 'webSearch' tool and provide a more detailed response.

            Your primary job is to have a natural conversation, not to be a search engine for every single message.`
        },
        {
            role: 'user',
            content: userMessage,
        },
    ];

    // This loop allows the model to use tools if necessary
    while (true) {
        try {
            const response = await groq.chat.completions.create({
                model: 'llama3-70b-8192',
                messages: messages,
                tools: [{
                    type: 'function',
                    function: {
                        name: 'webSearch',
                        description: 'Search the internet for real-time information, news, and events.',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'The search query.' },
                            },
                            required: ['query'],
                        },
                    },
                }],
                tool_choice: 'auto',
            });

            const responseMessage = response.choices[0].message;
            messages.push(responseMessage);

            const toolCalls = responseMessage.tool_calls;

            // If there are no tool calls, the model has given its final, conversational answer.
            if (!toolCalls) {
                // Return the text content for the UI to display.
                return responseMessage.content;
            }

            // If the model decides to call a tool, execute it.
            for (const toolCall of toolCalls) {
                if (toolCall.function.name === 'webSearch') {
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    const toolResult = await webSearch(functionArgs);
                    
                    // Add the tool's result to the conversation history
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: 'webSearch',
                        content: toolResult,
                    });
                }
            }
            // The loop will continue, sending the tool's result back to the model for a final answer.
        } catch (error) {
            console.error("An error occurred during AI generation:", error);
            return "Sorry, something went wrong on my end. Please try again.";
        }
    }
}
