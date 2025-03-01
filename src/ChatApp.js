import React, { useState, useEffect } from 'react';
import ChatList from './components/ChatList';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ProfileSidebar from './components/ProfileSidebar';
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
    const [showProfileSidebar, setShowProfileSidebar] = useState(false);

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
        if (isMobileView && !showSidebar && activeChat) {
            // When in mobile view with a chat open and sidebar closed,
            // we're using the button as a "back" button to show the chat list
            setShowSidebar(true);
        } else {
            // Regular toggle behavior
            setShowSidebar(!showSidebar);
        }

        // Close profile sidebar when opening chat sidebar
        if (showProfileSidebar && !showSidebar) {
            setShowProfileSidebar(false);
        }
    };

    const toggleProfileSidebar = () => {
        setShowProfileSidebar(!showProfileSidebar);
        // Close chat sidebar when opening profile sidebar on mobile
        if (isMobileView && showSidebar && !showProfileSidebar) {
            setShowSidebar(false);
        }
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
            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex overflow-hidden">
                {/* Profile Sidebar */}
                {showProfileSidebar && (
                    <div className={`${isMobileView ? 'position-absolute h-100 bg-white' : ''}`}
                         style={{
                             width: isMobileView ? '100%' : '300px',
                             zIndex: isMobileView ? 1040 : 'auto',
                             height: '100vh',
                             borderRight: '1px solid #dee2e6'
                         }}>
                        <ProfileSidebar
                            user={user}
                            logout={logout}
                            onClose={toggleProfileSidebar}
                        />
                    </div>
                )}

                {/* Chat List Sidebar */}
                {showSidebar && (
                    <div className={`${isMobileView ? 'position-absolute h-100 bg-white' : ''}`}
                         style={{
                             width: isMobileView ? '100%' : '300px',
                             zIndex: isMobileView ? 1030 : 'auto',
                             height: '100vh',
                             borderRight: '1px solid #dee2e6'
                         }}>
                        <ChatList
                            chats={chatList}
                            activeChat={activeChat}
                            onChatSelect={handleChatSelect}
                            currentUser={user}
                            onMenuClick={toggleProfileSidebar}
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