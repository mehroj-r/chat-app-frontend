import React, { useState, useEffect } from 'react';
import ChatList from './components/ChatList';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ProfileSidebar from './components/ProfileSidebar';
import { useAuth } from './auth/AuthContext';
import axios from 'axios';
import API_BASE_URL from './config/apiConfig';
import WebSocketServiceForMessages from './services/WebSocketServiceForMessages';
import WebSocketServiceForChats from './services/WebSocketServiceForChats';

const ChatApp = () => {
    const {user, logout } = useAuth();
    const [chatList, setChatList] = useState([]);
    const [messages, setMessages] = useState([]);
    // const [members, setMembers] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showProfileSidebar, setShowProfileSidebar] = useState(false);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobileView(mobile);

            if (!mobile) {
                setShowSidebar(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Fetch chat list initially and set up WebSocket for updates
    useEffect(() => {
        let isComponentMounted = true;
        let mountDelay;

        const fetchChats = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE_URL}/chats/`);

                if (isComponentMounted) {
                    setChatList(response.data);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching chats:', error);
                if (error.response && error.response.status === 401) {
                    logout();
                }
                if (isComponentMounted) {
                    setLoading(false);
                }
            }
        };

        // Initial data fetch
        fetchChats();

        // Handle chat list updates from WebSocket
        const handleChatListUpdate = (data) => {
            // Check if valid data was received
            if (!data || !data.id) {
                console.error('Received invalid chat update data:', data);
                return;
            }

            setChatList(prevChatList => {
                // Find if this chat already exists in the list
                const existingChatIndex = prevChatList.findIndex(chat => chat.id === data.id);

                if (existingChatIndex !== -1) {
                    // Update existing chat
                    const updatedList = [...prevChatList];
                    updatedList[existingChatIndex] = {
                        ...updatedList[existingChatIndex],
                        last_message: data.last_message,
                        type: data.type,
                        // Only update display_name if it exists in the incoming data
                        ...(data.display_name && { display_name: data.display_name }),
                        updated_at: new Date().toISOString(), // Add current timestamp for sorting
                        unread_count: activeChat && activeChat.id === data.id ? 0 : data.unread_count,
                    };

                    // Sort by most recent update
                    return updatedList.sort((a, b) =>
                        new Date(b.updated_at) - new Date(a.updated_at)
                    );
                } else {
                    // Add new chat to the list
                    const newChat = {
                        ...data,
                        updated_at: new Date().toISOString()
                    };

                    // Add to list and sort
                    return [...prevChatList, newChat].sort((a, b) =>
                        new Date(b.updated_at) - new Date(a.updated_at)
                    );
                }
            });
        };

        // Delay WebSocket connection to avoid React StrictMode double-mount issues
        mountDelay = setTimeout(() => {
            if (isComponentMounted) {
                // Set up WebSocket connection
                WebSocketServiceForChats
                    .connect()
                    .onUpdate(handleChatListUpdate)
                    .onConnect(() => {
                        console.log('Connected to chat list updates');
                    })
                    .onDisconnect(() => {
                        console.log('Disconnected from chat list updates');
                    });
            }
        }, 300); // Short delay to avoid React StrictMode issues

        // Clean up function
        return () => {
            isComponentMounted = false;
            clearTimeout(mountDelay);

            // Only remove the handler but don't disconnect during component unmount/remount cycles
            // This avoids the connection being closed prematurely
            WebSocketServiceForChats.removeUpdateHandler(handleChatListUpdate);

            // Only disconnect when unmounting for good (like page navigation)
            if (!document.hidden) {
                WebSocketServiceForChats.disconnect();
            }
        };
    }, [activeChat, logout]);
    // Fetch messages when active chat changes
    useEffect(() => {
        if (!activeChat) return;

        WebSocketServiceForMessages.disconnect();

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/chats/${activeChat.id}/messages`);
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
                if (error.response && error.response.status === 401) {
                    logout();
                }
            }
        };

        fetchMessages();

        // Connect to WebSocket for real-time messages
        WebSocketServiceForMessages
            .connect(activeChat.id)
            .onMessage(data => {

                console.log(data);

                // If server sends complete message list
                if (Array.isArray(data.messages)) {
                    setMessages(data.messages);
                }
                // If server sends just the new message
                else if (data.message) {
                    setMessages(oldMessages => [...oldMessages, data.message]);
                }
            })
            .onConnect(() => {
                console.log('Connected to chat WebSocket: ', activeChat.id);
            })
            .onDisconnect(() => {
                console.log('Disconnected from chat WebSocket: ', activeChat.id);
            });


    }, [activeChat, logout]);

    // Handles sending messages through WebSocket connection
    const handleSendMessage = (text) => {
        if (!text.trim() || !activeChat) return;

        try {
            // Check if WebSocket is connected
            if (!WebSocketServiceForMessages.isConnected()) {
                // Reconnect if not connected
                WebSocketServiceForMessages.connect(activeChat.id);
                // Wait a bit for connection to establish
                setTimeout(() => {
                    try {
                        WebSocketServiceForMessages.sendMessage(text, activeChat.id);
                    } catch (error) {
                        console.error('Error sending via WebSocket after reconnect:', error);
                        fallbackSendMessage(text);
                    }
                }, 500);
            } else {
                // Send message through WebSocket service
                WebSocketServiceForMessages.sendMessage(text, activeChat.id);
            }

        } catch (error) {
            console.error('Error sending message:', error);

            // Fallback to REST API if WebSocket fails
            fallbackSendMessage(text);
        }
    };

    // Fallback method using REST API if WebSocket fails
    const fallbackSendMessage = async (text) => {
        try {
            await axios.post(`${API_BASE_URL}/send/`, {
                chat: activeChat.id,
                text: text
            });

            // Fetch updated messages
            const response = await axios.get(`${API_BASE_URL}/chats/${activeChat.id}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error sending message via REST fallback:', error);
            if (error.response && error.response.status === 401) {
                logout();
            }
        }
    };

    const handleChatSelect = async (chat) => {
        setActiveChat(chat);

        // Reset unread count for the selected chat
        setChatList(prevChatList => {
            return prevChatList.map(c => {
                if (c.id === chat.id) {
                    return { ...c, unread_count: 0 };
                }
                return c;
            });
        });

        try {
            // const response = await axios.get(`${API_BASE_URL}/chats/${chat.id}/members`);
            // setMembers(response.data);

            // On mobile, hide sidebar after selecting a chat
            if (isMobileView) {
                setShowSidebar(false);
            }
        } catch (error) {
            console.error('Error fetching messages/members for selected chat:', error);
            if (error.response && error.response.status === 401) {
                logout();
            }
        }
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
        if (showProfileSidebar && !showSidebar) {
            setShowProfileSidebar(false);
        }
    };

    const toggleProfileSidebar = () => {
        setShowProfileSidebar(!showProfileSidebar);
        if (isMobileView && showSidebar && !showProfileSidebar) {
            setShowSidebar(false);
        }
    };

    if (loading && !activeChat && chatList.length === 0) {
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
                             borderRight: '1px solid #dee2e6',
                             top: 0,
                             left: 0
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
                             borderRight: '1px solid #dee2e6',
                             top: 0,
                             left: 0
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
                            <div className={`chat-header-container ${isMobileView ? 'fixed-top' : 'sticky-top'}`}>
                                <ChatHeader
                                    chat={activeChat}
                                    currentUser={user}
                                    toggleSidebar={toggleSidebar}
                                    isMobileView={isMobileView}
                                    showSidebar={showSidebar}
                                />
                            </div>
                            <div className="message-container-wrapper" style={{
                                height: isMobileView ? 'calc(100vh - 56px)' : 'calc(100vh - 56px)',
                                display: 'flex',
                                flexDirection: 'column',
                                flexGrow: 1,
                                overflow: 'hidden'
                            }}>
                                <MessageList
                                    messages={messages}
                                    currentUser={user}
                                    isMobileView={isMobileView}
                                />
                                <MessageInput onSendMessage={handleSendMessage} />
                            </div>
                        </>
                    )}
                    {!activeChat && !isMobileView && (
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