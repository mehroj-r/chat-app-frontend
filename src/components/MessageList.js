import React, { useRef, useEffect } from 'react';
import Avatar from './Avatar'; // Import the Avatar component

const MessageList = ({ messages, currentUser, isMobileView }) => {
    const messagesEndRef = useRef(null);
    const avatarWidth = 48; // Width of the Avatar component
    const avatarMargin = 8; // Margin between avatar and message (me-2 or ms-2)
    const avatarSpace = avatarWidth + avatarMargin; // Total space needed for avatar
    const colors = ['#007bff', '#6f42c1', '#e83e8c', '#fd7e14', '#28a745', '#20c997', '#17a2b8', '#6c757d'];

    // Auto scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            // Use scrollIntoView with a different behavior to prevent affecting the header
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth', // Animate scrolling
            });
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

    // Group messages by date - ensure unique messages with Set
    const groupMessagesByDate = () => {
        // First, deduplicate messages by ID
        const uniqueMessages = Array.from(
            new Map(messages.map(message => [message.id, message])).values()
        );

        const groups = {};

        uniqueMessages.forEach(message => {
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

    // Group consecutive messages from the same sender
    const processMessagesWithConsecutiveGroups = (messages) => {
        const result = [];
        let currentSender = null;

        messages.forEach((message, index) => {
            // Check if this is the first message or a message from a different sender
            const isNewSender = !currentSender || message.sender_username !== currentSender;
            // Check if this is the last message in the array or if the next message is from a different sender
            const isLastInGroup = index === messages.length - 1 ||
                messages[index + 1].sender_username !== message.sender_username;

            result.push({
                ...message,
                isFirstInGroup: isNewSender,
                isLastInGroup: isLastInGroup
            });

            currentSender = message.sender_username;
        });

        return result;
    };

    const messageGroups = groupMessagesByDate();

    // Calculate the right height for the message container
    const getContainerStyle = () => {
        const baseStyle = {
            backgroundImage: "url('/api/placeholder/800/600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            overflowY: 'auto'
        };

        // For desktop view
        if (!isMobileView) {
            return {
                ...baseStyle,
                height: 'calc(100% - 60px)', // Adjust for message input height
                flexGrow: 1
            };
        }

        // For mobile view
        return {
            ...baseStyle,
            height: 'calc(100vh - 116px)',
            maxHeight: 'calc(100vh - 116px)'
        };
    };

    // Enhanced message list rendering with proper consecutive message handling
    const renderMessages = (processedMessages) => {
        // Sort messages by timestamp to ensure correct order
        const sortedMessages = [...processedMessages].sort((a, b) => {
            return new Date(a.sent_at) - new Date(b.sent_at);
        });

        // First pass: identify consecutive message groups and assign position attributes
        const enhancedMessages = sortedMessages.map((message, index, arr) => {
            const isMe = currentUser && message.sender_username === currentUser.username;
            const isSameSenderAsPrevious = index > 0 && message.sender_username === arr[index - 1].sender_username;
            const isSameSenderAsNext = index < arr.length - 1 && message.sender_username === arr[index + 1].sender_username;

            return {
                ...message,
                isMe,
                // Identify position in consecutive message chain
                positionInChain: {
                    isFirstInChain: !isSameSenderAsPrevious,
                    isMiddleInChain: isSameSenderAsPrevious && isSameSenderAsNext,
                    isLastInChain: !isSameSenderAsNext,
                    isInChain: isSameSenderAsPrevious || isSameSenderAsNext
                }
            };
        });

        // Create a Set to track message IDs we've already rendered
        const renderedMessageIds = new Set();

        return enhancedMessages.map((message, index) => {
            // Skip if we've already rendered this message
            if (renderedMessageIds.has(message.id)) {
                return null;
            }

            // Add message ID to our tracking Set
            renderedMessageIds.add(message.id);

            const { isMe, positionInChain } = message;
            const { isFirstInChain, isLastInChain } = positionInChain;

            // Set margins based on position in chain
            // Make consecutive messages close but not connected
            let marginClass = 'mb-1'; // Small gap between consecutive messages from same sender

            // Larger margin if this is the last message in a chain (to separate different senders)
            if (isLastInChain) {
                marginClass = 'mb-3';
            }

            // Adjust bubble corners based on position in chain
            let bubbleCornerClass = '';
            if (isMe) {
                if (isFirstInChain && !isLastInChain) {
                    bubbleCornerClass = 'rounded-bottom-end-0';
                } else if (!isFirstInChain && !isLastInChain) {
                    bubbleCornerClass = 'rounded-top-end-0 rounded-bottom-end-0';
                } else if (!isFirstInChain && isLastInChain) {
                    bubbleCornerClass = 'rounded-top-end-0';
                } else {
                    bubbleCornerClass = 'rounded-bottom-end-0';
                }
            } else {
                if (isFirstInChain && !isLastInChain) {
                    bubbleCornerClass = 'rounded-bottom-start-0';
                } else if (!isFirstInChain && !isLastInChain) {
                    bubbleCornerClass = 'rounded-top-start-0 rounded-bottom-start-0';
                } else if (!isFirstInChain && isLastInChain) {
                    bubbleCornerClass = 'rounded-top-start-0';
                } else {
                    bubbleCornerClass = 'rounded-bottom-start-0';
                }
            }

            const colorIndex = currentUser.first_name ? currentUser.first_name.length % colors.length : 0;

            return (
                <div
                    key={message.id}
                    className={`${marginClass} d-flex`}
                    style={{
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                    }}
                >
                    {/* Placeholder for avatar space to maintain consistent indentation */}
                    {!isMe && !message.isLastInGroup && (
                        <div style={{ width: `${avatarSpace}px`, flexShrink: 0 }}></div>
                    )}

                    {/* Avatar for non-current user messages - shown only for last message in consecutive group */}
                    {!isMe && message.isLastInGroup && (
                        <div className="me-2 align-self-end" style={{ flexShrink: 0 }}>
                            <Avatar name={message.sender_name} />
                        </div>
                    )}

                    <div
                        className={`d-inline-block rounded-3 ${
                            isMe ? 'bg-primary text-white' : 'bg-light border'
                        } ${bubbleCornerClass}`}
                        style={{
                            maxWidth: '75%',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            position: 'relative', // For absolute positioning of the timestamp
                            padding: '8px 12px', // Slightly larger than p-2 but smaller than p-3
                            minWidth: '100px' // Ensure minimum width for very short messages
                        }}
                    >
                        {/* Show sender name only for the first message in a group for non-current user */}
                        {!isMe && message.isFirstInGroup && (
                            <div className="fw-medium mb-1 small" style={{ color: colors[colorIndex] }}>
                                {message.sender_name}
                            </div>
                        )}

                        <div style={{
                            marginBottom: '0', // Remove margin to let timestamp overlap
                            paddingRight: '60px' // Add padding to prevent text from being hidden by timestamp
                        }}>
                            {message.text}
                        </div>

                        {/* Timestamp that overlaps with the last line */}
                        <div
                            style={{
                                position: 'absolute',
                                right: '8px',
                                bottom: '8px', // Positioned to overlap with the last line
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                padding: '0 4px',
                                backgroundColor: isMe ? 'rgba(13, 110, 253, 0.8)' : 'rgba(255, 255, 255, 0.8)', // Semi-transparent background for better readability
                                borderRadius: '3px'
                            }}
                            className={isMe ? 'text-white' : 'text-muted'}
                        >
                            {formatTime(message.sent_at)}
                        </div>
                    </div>
                </div>
            );
        }).filter(Boolean); // Filter out null values (duplicates)
    };

    return (
        <div
            className="p-4 overflow-auto flex-grow-1 position-relative"
            style={getContainerStyle()}
        >
            {messageGroups.map((group) => {
                const processedMessages = processMessagesWithConsecutiveGroups(group.messages);

                return (
                    <div key={group.date}>
                        <div className="text-center mb-3">
                            <span className="badge bg-dark text-white rounded-pill px-3 py-2">
                                {group.label}
                            </span>
                        </div>

                        {renderMessages(processedMessages)}
                    </div>
                );
            })}

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