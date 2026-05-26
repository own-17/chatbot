// Get references to HTML elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('input');
const askButton = document.getElementById('ask');

/**
 * Create chat bubbles
 */
function createMessageBubble(sender, message) {

    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-4';

    // Prevent HTML injection
    const sanitizedMessage = message
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    if (sender === 'user') {

        // User message
        messageDiv.classList.add('flex', 'justify-end');

        messageDiv.innerHTML = `
            <div class="bg-blue-600 max-w-xs md:max-w-md p-3 rounded-2xl rounded-br-none shadow-md">
                <p class="text-white text-sm">${sanitizedMessage}</p>
            </div>
        `;

    } else {

        // AI message
        messageDiv.classList.add('flex', 'justify-start');

        messageDiv.innerHTML = `
            <div class="bg-neutral-700 max-w-xs md:max-w-md p-3 rounded-2xl rounded-bl-none shadow-md">
                <p class="text-white text-sm leading-6">
                    ${sanitizedMessage.replace(/\n/g, '<br>')}
                </p>
            </div>
        `;
    }

    chatContainer.appendChild(messageDiv);

    // Auto scroll
    window.scrollTo(0, document.body.scrollHeight);
}

/**
 * Show typing animation
 */
function showThinkingIndicator() {

    const indicatorDiv = document.createElement('div');

    indicatorDiv.id = 'thinking-indicator';

    indicatorDiv.className = 'flex justify-start mb-4';

    indicatorDiv.innerHTML = `
        <div class="bg-neutral-700 p-3 rounded-2xl rounded-bl-none">
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
            </div>
        </div>
    `;

    chatContainer.appendChild(indicatorDiv);

    window.scrollTo(0, document.body.scrollHeight);
}

/**
 * Remove typing animation
 */
function removeThinkingIndicator() {

    const indicator = document.getElementById('thinking-indicator');

    if (indicator) {
        indicator.remove();
    }
}

/**
 * Send message to backend
 */
async function handleSendMessage() {

    const message = messageInput.value.trim();

    if (!message) return;

    // Show user message
    createMessageBubble('user', message);

    messageInput.value = '';

    askButton.disabled = true;

    askButton.classList.add('opacity-50', 'cursor-not-allowed');

    // Show typing animation
    showThinkingIndicator();

    try {

        // Works for both localhost and Render
        const API_URL =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3001/chat'
                : '/chat';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();

        removeThinkingIndicator();

        // Show AI response
        createMessageBubble('assistant', data.response);

    } catch (error) {

        console.error('Connection error:', error);

        removeThinkingIndicator();

        createMessageBubble(
            'assistant',
            'Sorry, I could not connect to the server.'
        );

    } finally {

        askButton.disabled = false;

        askButton.classList.remove('opacity-50', 'cursor-not-allowed');

        messageInput.focus();
    }
}

// Ask button click
askButton.addEventListener('click', handleSendMessage);

// Send message on Enter
messageInput.addEventListener('keydown', (event) => {

    if (event.key === 'Enter' && !event.shiftKey) {

        event.preventDefault();

        handleSendMessage();
    }
});