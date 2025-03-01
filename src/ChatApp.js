import React, { useState, useEffect } from 'react';
import ChatList from './components/ChatList';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import { useAuth } from './auth/AuthContext';
import axios from 'axios';

const ChatApp = () => {
    const { user, logout } = useAuth();
    const [chatList, setChatList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobileView(mobile);
            // On larger screens, always show sidebar
            if (!mobile) {
                setShowSidebar(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

            // On mobile, hide sidebar after selecting a chat
            if (isMobileView) {
                setShowSidebar(false);
            }
        } catch (error) {
            console.error('Error fetching messages for selected chat:', error);
            if (error.response && error.response.status === 401) {
                logout();
            }
        }
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    if (loading && !activeChat) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 vw-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="vh-100 vw-100 d-flex flex-column overflow-hidden p-0 m-0">
            {/* Main App Header */}
            <div className="bg-white d-flex justify-content-between align-items-center px-3 py-2 shadow-sm">
                <div className="d-flex align-items-center">
                    {isMobileView && activeChat && !showSidebar && (
                        <button
                            className="btn btn-sm me-2"
                            onClick={toggleSidebar}
                        >
                            <i className="bi bi-arrow-left"></i>
                        </button>
                    )}
                    <h4 className="mb-0">Chat App</h4>
                </div>
                <div className="d-flex align-items-center">
                    {user && (
                        <span className="me-3 d-none d-md-block">
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

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex overflow-hidden">
                {/* Chat List Sidebar - conditionally shown based on state */}
                {showSidebar && (
                    <div className={`${isMobileView ? 'position-absolute h-100 bg-white' : ''}`}
                         style={{
                             width: isMobileView ? '100%' : '300px',
                             zIndex: isMobileView ? 1030 : 'auto',
                             height: 'calc(100vh - 49px)',
                             borderRight: '1px solid #dee2e6'
                         }}>
                        <ChatList
                            chats={chatList}
                            activeChat={activeChat}
                            onChatSelect={handleChatSelect}
                            currentUser={user}
                        />
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-grow-1 d-flex flex-column">
                    {activeChat && (
                        <>
                            <ChatHeader
                                chat={activeChat}
                                currentUser={user}
                                toggleSidebar={toggleSidebar}
                                isMobileView={isMobileView}
                                showSidebar={showSidebar}
                            />
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
    );
};

export default ChatApp;