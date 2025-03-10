class ChatWebSocketService {
    constructor() {
        this.socket = null;
        this.messageHandlers = [];
        this.connectionHandlers = {
            onConnect: [],
            onDisconnect: []
        };
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // Start with 2 seconds delay
    }

    // Connect to WebSocket for a specific chat
    connect(chatId) {
        // Close existing connection if any
        this.disconnect();

        // Reset reconnect attempts on manual connect
        this.reconnectAttempts = 0;

        // Detect if we're running on localhost or on a network
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Use the appropriate base URL
        const wsBaseUrl = isLocalhost
            ? 'ws://127.0.0.1:8000'
            : `ws://${window.location.hostname.split(':')[0]}:8000`;

        // Create new WebSocket connection
        this.socket = new WebSocket(`${wsBaseUrl}/ws/chats/${chatId}/`);

        // Set up event handlers
        this.socket.onopen = () => {
            console.log('WebSocket connection established');
            this.reconnectAttempts = 0;
            this.connectionHandlers.onConnect.forEach(handler => handler());

            this.sendAuthToken(); // Send auth token
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.messageHandlers.forEach(handler => handler(data));
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
            this.connectionHandlers.onDisconnect.forEach(handler => handler(event));

            // Attempt to reconnect if not closed intentionally
            if (event.code !== 1000) {
                this.attemptReconnect(chatId);
            }
        };

        return this;
    }

    // Send authentication token
    sendAuthToken() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('Cannot authenticate: WebSocket is not connected');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found in localStorage');
            this.socket.close(4001, 'No authentication token available');
            return;
        }

        console.log(token);

        this.socket.send(JSON.stringify({
            token: token
        }));

        console.log('Authentication token sent');
    }

    // Attempt to reconnect with exponential backoff
    attemptReconnect(chatId) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                console.log('Reconnecting...');
                this.connect(chatId);
            }, delay);
        } else {
            console.error('Maximum reconnection attempts reached');
        }
    }

    // Send a message through the WebSocket
    sendMessage(text, chatId) {

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.socket.send(JSON.stringify({
            chat_id: chatId,
            text: text
        }));
    }

    // Register a handler for incoming messages
    onMessage(handler) {
        this.messageHandlers.push(handler);
        return this; // For chaining
    }

    // Register handlers for connection events
    onConnect(handler) {
        this.connectionHandlers.onConnect.push(handler);
        return this;
    }

    onDisconnect(handler) {
        this.connectionHandlers.onDisconnect.push(handler);
        return this;
    }

    // Remove a specific message handler
    removeMessageHandler(handler) {
        this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        return this;
    }

    // Remove a specific connection handler
    removeConnectionHandler(type, handler) {
        if (this.connectionHandlers[type]) {
            this.connectionHandlers[type] = this.connectionHandlers[type].filter(h => h !== handler);
        }
        return this;
    }

    // Disconnect and clean up
    disconnect() {
        if (this.socket) {
            // Use code 1000 for normal closure
            this.socket.close(1000, 'Disconnecting normally');
            this.socket = null;
        }
        return this;
    }

    // Check if WebSocket is connected
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

// Export as singleton
const chatWebSocketService = new ChatWebSocketService();
export default chatWebSocketService;