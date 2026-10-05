import Groq from 'groq-sdk';
import { tavily } from '@tavily/core';


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });


// this function search data from web
async function webSearch({ query }) {

    console.log(`🔎 Calling web search tool with query: "${query}"`);

    try {

        const response = await tvly.search(query, { maxResults: 5 });

        // Return a simple, formatted string for the model to process
        return response.results
            .map(
                r => `Title: ${r.title}\nContent: ${r.content}`
            )
            .join('\n\n');

    } catch (error) {

        console.error("Error during Tavily search:", error);

        return "Error searching the web.";
    }
}


// this function generate AI response
export async function generate(userMessage) {

    const messages = [
        {
            role: 'system',

            // This prompt controls AI personality and behavior
            content: `You are a friendly and conversational AI assistant. Your goal is to chat like a real person.

            **Your Personality:**
            - Be friendly, direct, and helpful.
            - Keep your answers short and to the point for simple greetings and questions.
            - Only provide detailed answers when needed.

            **How to Behave:**
            - IF the user says "hi" or "hello": respond casually.
            - IF the user asks simple questions: give short answers.
            - IF the user asks for complex or real-time information: use webSearch tool.

            Your main goal is natural conversation.`
        },

        {
            role: 'user',
            content: userMessage,
        },
    ];

    // loop continues until final response is generated
    while (true) {

        try {

            const response = await groq.chat.completions.create({

                model: "llama-3.1-8b-instant",

                messages: messages,

                // tool setup
                tools: [
                    {
                        type: 'function',

                        function: {
                            name: 'webSearch',

                            description:
                                'Search the internet for real-time information.',

                            parameters: {
                                type: 'object',

                                properties: {
                                    query: {
                                        type: 'string',
                                        description: 'The search query.',
                                    },
                                },

                                required: ['query'],
                            },
                        },
                    },
                ],

                tool_choice: 'auto',
            });

            const responseMessage =
                response.choices[0].message;

            messages.push(responseMessage);

            const toolCalls =
                responseMessage.tool_calls;

            // If there are no tool calls, the model has given its final, conversational answer.
            if (!toolCalls) {

                // Return the text content for the UI to display.
                return responseMessage.content;
            }

            // Handle tool calls
            for (const toolCall of toolCalls) {

                if (toolCall.function.name === 'webSearch') {

                    const functionArgs = JSON.parse(
                        toolCall.function.arguments
                    );

                    const toolResult =
                        await webSearch(functionArgs);

                    // Add the tool's result to the conversation history
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: 'webSearch',
                        content: toolResult,
                    });
                }
            }

            // The loop continues and sends tool results back to the model

        } catch (error) {

            console.error(
                "An error occurred during AI generation:",
                error
            );

            return "Sorry, something went wrong on my end. Please try again.";
        }
    }
}