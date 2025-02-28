import React from 'react';
import Avatar from './Avatar';
import { MenuIcon, SearchIcon, CheckIcon } from './Icons';

const ChatList = ({ chats, activeChat, onChatSelect, currentUser }) => {
    // Format timestamp from API to display time or date
    const formatTime = (timestampStr) => {
        if (!timestampStr) return '';

        const timestamp = new Date(timestampStr.replace(' ', 'T'));
        const now = new Date();
        const isToday = timestamp.toDateString() === now.toDateString();

        if (isToday) {
            return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            // If not today, show date
            const options = { month: 'short', day: 'numeric' };
            return timestamp.toLocaleDateString(undefined, options);
        }
    };

    // Helper to get other person's name in a chat
    const getChatName = (chat) => {
        if (!chat || !chat.last_message || !currentUser) return 'Loading...';

        // For now, we'll use the sender name from last message
        // In a real app, you'd want to get the actual chat name or participant name
        const lastMessageSender = chat.last_message.sender_username;
        return lastMessageSender === currentUser.username
            ? `Chat ${chat.id}` // Replace with actual recipient name when API provides it
            : chat.last_message.sender_name;
    };

    return (
        <>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                <button className="btn btn-light btn-sm rounded-circle">
                    <MenuIcon />
                </button>
                <div className="position-relative flex-grow-1 mx-2">
                    <input
                        type="text"
                        placeholder="Search"
                        className="form-control form-control-sm rounded-pill bg-light"
                    />
                    <div className="position-absolute end-0 top-50 translate-middle-y pe-3 text-muted">
                        <SearchIcon />
                    </div>
                </div>
            </div>

            {/* Chat List */}
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 170px)' }}>
                {chats.map((chat) => {
                    const chatName = getChatName(chat);
                    const lastMessage = chat.last_message?.text || 'No messages yet';
                    const time = chat.last_message ? formatTime(chat.last_message.sent_at) : '';

                    return (
                        <div
                            key={chat.id}
                            className={`d-flex align-items-center p-3 cursor-pointer ${
                                activeChat && activeChat.id === chat.id ? 'bg-light' : ''
                            }`}
                            onClick={() => onChatSelect(chat)}
                            style={{ cursor: 'pointer' }}
                        >
                            <Avatar name={chatName} />
                            <div className="ms-3 flex-grow-1">
                                <div className="d-flex justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <span className="fw-medium">{chatName}</span>
                                    </div>
                                    <span className="small text-muted">{time}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-1">
                                    <span className="text-truncate me-2 text-muted small" style={{ maxWidth: '150px' }}>
                                        {lastMessage}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {chats.length === 0 && (
                    <div className="text-center p-4 text-muted">
                        No chats available
                    </div>
                )}
            </div>
        </>
    );
};

export default ChatList;