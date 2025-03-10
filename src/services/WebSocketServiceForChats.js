class ChatListWebSocketService {
    constructor() {
        this.socket = null;
        this.updateHandlers = [];
        this.connectionHandlers = {
            onConnect: [],
            onDisconnect: []
        };
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // Start with 2 seconds delay
    }

    // Connect to WebSocket for user's chat list
    connect() {
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

        // Create new WebSocket connection for chat list updates
        this.socket = new WebSocket(`${wsBaseUrl}/ws/chats/`);

        // Set up event handlers
        this.socket.onopen = () => {
            console.log('Chat list WebSocket connection established');
            this.reconnectAttempts = 0;
            this.connectionHandlers.onConnect.forEach(handler => handler());

            this.sendAuthToken(); // Send auth token
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.updateHandlers.forEach(handler => handler(data));
            } catch (error) {
                console.error('Error parsing chat list WebSocket message:', error);
            }
        };

        this.socket.onerror = (error) => {
            console.error('Chat list WebSocket error:', error);
        };

        this.socket.onclose = (event) => {
            console.log('Chat list WebSocket connection closed', event);
            this.connectionHandlers.onDisconnect.forEach(handler => handler(event));

            // Attempt to reconnect if not closed intentionally
            if (event.code !== 1000) {
                this.attemptReconnect();
            }
        };

        return this;
    }

    // Send authentication token
    sendAuthToken() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('Cannot authenticate: Chat list WebSocket is not connected');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found in localStorage');
            this.socket.close(4001, 'No authentication token available');
            return;
        }

        this.socket.send(JSON.stringify({
            token: token
        }));

        console.log('Authentication token sent for chat list WebSocket');
    }

    // Attempt to reconnect with exponential backoff
    attemptReconnect(userId) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

            console.log(`Attempting to reconnect chat list in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                console.log('Reconnecting chat list WebSocket...');
                this.connect(userId);
            }, delay);
        } else {
            console.error('Maximum reconnection attempts reached for chat list WebSocket');
        }
    }

    // Register a handler for incoming chat list updates
    onUpdate(handler) {
        this.updateHandlers.push(handler);
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

    // Remove a specific update handler
    removeUpdateHandler(handler) {
        this.updateHandlers = this.updateHandlers.filter(h => h !== handler);
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
const chatListWebSocketService = new ChatListWebSocketService();
export default chatListWebSocketService;