// Get references to the essential HTML elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('input');
const askButton = document.getElementById('ask');

/**
 * Creates and appends a message bubble to the chat container.
 * @param {string} sender - Who sent the message ('user' or 'assistant').
 * @param {string} message - The message content.
 */
function createMessageBubble(sender, message) {
    // Create the main div for the message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-4'; // Add margin-bottom for spacing

    // Sanitize the message to prevent HTML injection
    const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (sender === 'user') {
        // User messages are right-aligned
        messageDiv.classList.add('flex', 'justify-end');
        messageDiv.innerHTML = `
            <div class="bg-blue-600 max-w-xs md:max-w-md p-3 rounded-2xl rounded-br-none">
                <p class="text-white text-sm">${sanitizedMessage}</p>
            </div>
        `;
    } else { // Assistant messages are left-aligned
        messageDiv.classList.add('flex', 'justify-start');
        messageDiv.innerHTML = `
            <div class="bg-neutral-700 max-w-xs md:max-w-md p-3 rounded-2xl rounded-bl-none">
                <p class="text-white text-sm">${sanitizedMessage.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }

    chatContainer.appendChild(messageDiv);

    // Automatically scroll to the bottom to show the latest message
    window.scrollTo(0, document.body.scrollHeight);
}

/**
 * Shows a "thinking..." indicator for the assistant.
 */
function showThinkingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.id = 'thinking-indicator';
    indicatorDiv.className = 'flex justify-start mb-4';
    indicatorDiv.innerHTML = `
        <div class="bg-neutral-700 p-3 rounded-2xl rounded-bl-none">
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style="animation-delay: 0s;"></div>
                <div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                <div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
            </div>
        </div>
    `;
    chatContainer.appendChild(indicatorDiv);
    window.scrollTo(0, document.body.scrollHeight);
}

/**
 * Removes the "thinking..." indicator.
 */
function removeThinkingIndicator() {
    const indicator = document.getElementById('thinking-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Handles the process of sending a message and getting a reply.
 */
async function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message) return; // Don't do anything if the input is empty

    // 1. Display the user's message immediately
    createMessageBubble('user', message);
    messageInput.value = ''; // Clear the input field
    askButton.disabled = true; // Disable the button to prevent spamming
    askButton.classList.add('opacity-50', 'cursor-not-allowed');

    // 2. Show a thinking indicator
    showThinkingIndicator();

    try {
        // 3. Send the message to your backend server
        const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.response;

        // 4. Remove the indicator and display the AI's actual response
        removeThinkingIndicator();
        createMessageBubble('assistant', aiResponse);

    } catch (error) {
        console.error("Failed to get response from server:", error);
        removeThinkingIndicator();
        createMessageBubble('assistant', 'Sorry, I couldn\'t connect to the server. Please make sure it\'s running and try again.');
    } finally {
        // 5. Re-enable the ask button
        askButton.disabled = false;
        askButton.classList.remove('opacity-50', 'cursor-not-allowed');
        messageInput.focus(); // Put the cursor back in the text area
    }
}

// --- Event Listeners ---

// Listen for clicks on the "Ask" button
askButton.addEventListener('click', handleSendMessage);

// Listen for the "Enter" key in the text area
messageInput.addEventListener('keydown', (event) => {
    // Check if Enter is pressed without the Shift key
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent a new line from being added
        handleSendMessage();
    }
});
