import React, { useState, useEffect } from 'react';
// Remove this line since you'll get it from props
// import { useNavigate } from 'react-router-dom';
import ChatList from './components/ChatList';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import { useAuth } from './auth/AuthContext';
import axios from 'axios';

const ChatApp = () => {
    const { user, logout } = useAuth();
    // Replace useNavigate hook with a prop or with proper context
    // const navigate = useNavigate();
    const [chatList, setChatList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch chat list
    useEffect(() => {
        const fetchChats = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://127.0.0.1:8000/api/v1/chats/');
                setChatList(response.data);

                // Set first chat as active if no active chat is selected
                if (response.data.length > 0 && !activeChat) {
                    setActiveChat(response.data[0]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching chats:', error);
                if (error.response && error.response.status === 401) {
                    logout();
                }
                setLoading(false);
            }
        };

        fetchChats();
        // Poll for new chats every 30 seconds
        const intervalId = setInterval(fetchChats, 30000);

        return () => clearInterval(intervalId);
    }, [activeChat, logout]);

    // Fetch messages when active chat changes
    useEffect(() => {
        if (!activeChat) return;

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/v1/chats/${activeChat.id}/messages`);
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
                if (error.response && error.response.status === 401) {
                    logout();
                }
            }
        };

        fetchMessages();

        // Poll for new messages every 3 seconds when a chat is active
        const intervalId = setInterval(fetchMessages, 3000);

        return () => clearInterval(intervalId);
    }, [activeChat, logout]);

    const handleSendMessage = async (text) => {
        if (!text.trim() || !activeChat) return;

        try {
            await axios.post('http://127.0.0.1:8000/api/v1/send/', {
                chat: activeChat.id,
                text: text
            });

            // Fetch updated messages
            const response = await axios.get(`http://127.0.0.1:8000/api/v1/chats/${activeChat.id}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error sending message:', error);
            if (error.response && error.response.status === 401) {
                logout();
            }
        }
    };

    const handleChatSelect = async (chat) => {
        setActiveChat(chat);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/v1/chats/${chat.id}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages for selected chat:', error);
            if (error.response && error.response.status === 401) {
                logout();
            }
        }
    };

    if (loading && !activeChat) {
        return (
            <div className="container-fluid bg-light py-4 min-vh-100 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-light py-4 min-vh-100">
            <div className="row justify-content-center">
                <div className="col-12 col-lg-10">
                    <div className="card shadow-lg">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
                            <h4 className="mb-0">Chat App</h4>
                            <div className="d-flex align-items-center">
                                {user && (
                                    <span className="me-3">
                                        <strong>Hello, {user.username}</strong>
                                    </span>
                                )}
                                <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={logout}
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div className="row g-0">
                                {/* Chat List Sidebar */}
                                <div className="col-md-4 col-lg-3 border-end">
                                    <ChatList
                                        chats={chatList}
                                        activeChat={activeChat}
                                        onChatSelect={handleChatSelect}
                                        currentUser={user}
                                    />
                                </div>

                                {/* Chat Area */}
                                <div className="col-md-8 col-lg-9 d-flex flex-column">
                                    {activeChat && (
                                        <>
                                            <ChatHeader chat={activeChat} currentUser={user} />
                                            <MessageList
                                                messages={messages}
                                                currentUser={user}
                                            />
                                            <MessageInput onSendMessage={handleSendMessage} />
                                        </>
                                    )}
                                    {!activeChat && (
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                            <h3 className="text-muted">Select a chat to start messaging</h3>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatApp;