import WS_BASE_URL from "../config/wsConfig";

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
        // If already connecting or connected, don't create a new connection
        if (this.socket) {
            if (this.socket.readyState === WebSocket.CONNECTING) {
                console.log('WebSocket is already connecting, skipping new connection attempt');
                return this;
            }
            if (this.socket.readyState === WebSocket.OPEN) {
                console.log('WebSocket is already connected');
                return this;
            }
            // If socket exists but isn't connecting or open, close it properly
            this.disconnect();
        }

        // Reset reconnect attempts on manual connect
        this.reconnectAttempts = 0;

        // Create new WebSocket connection for chat list updates
        this.socket = new WebSocket(`${WS_BASE_URL}/ws/chats/`);

        // Set up event handlers
        this.socket.onopen = () => {
            console.log('Chat list WebSocket connection established');
            this.reconnectAttempts = 0;
            this.connectionHandlers.onConnect.forEach(handler => handler());

            // Slight delay to ensure connection is fully established
            setTimeout(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.sendAuthToken();
                }
            }, 100);
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
        if (!this.socket) {
            console.error('Cannot authenticate: No WebSocket instance exists');
            return;
        }

        if (this.socket.readyState !== WebSocket.OPEN) {
            console.error(`Cannot authenticate: WebSocket is not open (state: ${this.socket.readyState})`);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found in localStorage');
            this.socket.close(4001, 'No authentication token available');
            return;
        }

        try {
            this.socket.send(JSON.stringify({
                token: token
            }));
            console.log('Authentication token sent for chat list WebSocket');
        } catch (e) {
            console.error('Error sending auth token:', e);
        }
    }

    // Attempt to reconnect with exponential backoff
    attemptReconnect() {
        // Don't try to reconnect if we're already connecting or connected
        if (this.socket) {
            if (this.socket.readyState === WebSocket.CONNECTING ||
                this.socket.readyState === WebSocket.OPEN) {
                console.log('Already connecting or connected, skipping reconnect');
                return;
            }
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

            console.log(`Attempting to reconnect chat list in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                console.log('Reconnecting chat list WebSocket...');
                this.connect();
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
            try {
                // Only attempt to close if not already closed
                if (this.socket.readyState !== WebSocket.CLOSED &&
                    this.socket.readyState !== WebSocket.CLOSING) {
                    // Use code 1000 for normal closure
                    this.socket.close(1000, 'Disconnecting normally');
                }
            } catch (e) {
                console.error('Error closing WebSocket:', e);
            } finally {
                this.socket = null;
            }
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