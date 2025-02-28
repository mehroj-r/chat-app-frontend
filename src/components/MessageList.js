import React, { useRef, useEffect } from 'react';

const MessageList = ({ messages, currentUser }) => {
    const messagesEndRef = useRef(null);

    // Auto scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Format timestamp from API
    const formatTime = (timestampStr) => {
        if (!timestampStr) return '';

        const timestamp = new Date(timestampStr.replace(' ', 'T'));
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Format date for the date divider
    const formatDate = (timestampStr) => {
        if (!timestampStr) return '';

        const timestamp = new Date(timestampStr.replace(' ', 'T'));
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (timestamp.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (timestamp.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return timestamp.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    // Group messages by date
    const groupMessagesByDate = () => {
        const groups = {};

        messages.forEach(message => {
            const date = message.sent_at.split(' ')[0]; // Get the date part
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });

        return Object.entries(groups).map(([date, msgs]) => ({
            date,
            label: formatDate(msgs[0].sent_at),
            messages: msgs
        }));
    };

    const messageGroups = groupMessagesByDate();

    return (
        <div
            className="p-4 overflow-auto flex-grow-1 position-relative"
            style={{
                backgroundImage: "url('/api/placeholder/800/600')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: '300px'
            }}
        >
            {messageGroups.map((group) => (
                <div key={group.date}>
                    <div className="text-center mb-4">
                        <span className="badge bg-dark text-white rounded-pill px-3 py-2">
                            {group.label}
                        </span>
                    </div>

                    {group.messages.map((message) => {
                        const isMe = currentUser && message.sender_username === currentUser.username;

                        return (
                            <div
                                key={message.id}
                                className={`mb-3 ${isMe ? 'text-end' : 'text-start'}`}
                            >
                                <div
                                    className={`d-inline-block p-3 rounded-3 ${
                                        isMe
                                            ? 'bg-primary text-white'
                                            : 'bg-light border'
                                    } ${isMe ? 'rounded-bottom-end-0' : 'rounded-bottom-start-0'}`}
                                    style={{
                                        maxWidth: '75%',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {!isMe && (
                                        <div className="fw-medium mb-1 small">
                                            {message.sender_name}
                                        </div>
                                    )}
                                    {message.text}
                                    <div className="d-flex align-items-center justify-content-end mt-1">
                                        <span className={`small me-1 ${isMe ? 'text-white-50' : 'text-muted'}`}>
                                            {formatTime(message.sent_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {messages.length === 0 && (
                <div className="text-center p-4 text-muted">
                    No messages yet
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;