import React, { useState } from 'react';
import { SmileIcon, SendIcon } from './Icons';
import WebSocketServiceForMessages from '../services/WebSocketServiceForMessages';

const MessageInput = ({ onSendMessage, currentUser }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newMessage.trim() && !isSending) {
            setIsSending(true);
            await onSendMessage(newMessage);
            setNewMessage('');
            setIsSending(false);
        }
    };

    // Handle focus and blur events to send typing status
    const handleFocus = () => {
        setIsFocused(true);
        sendTypingStatus(isFocused);
    };

    const handleBlur = () => {
        setIsFocused(false);
        sendTypingStatus(isFocused);
    };

    // Send typing status through WebSocket
    const sendTypingStatus = (isTyping) => {
        if (!WebSocketServiceForMessages.isConnected()) {
            return;
        }

        try {
            WebSocketServiceForMessages.sendTypingStatus({
                typing_status: !isTyping ? `typing ...` : 'last seen recently',
                username: currentUser.username
            });
        } catch (error) {
            console.error('Error sending typing status:', error);
        }
    };

    return (
        <div className="p-3 border-top" style={{ marginBottom: 0, paddingBottom: 0 }}>
            <form onSubmit={handleSubmit} className="d-flex align-items-center" style={{ marginBottom: 0 }}>
                <button type="button" className="btn btn-light btn-sm rounded-circle">
                    <SmileIcon />
                </button>
                <input
                    type="text"
                    placeholder="Message"
                    className="form-control mx-2 rounded-pill"
                    value={newMessage}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    disabled={isSending}
                />
                <button
                    type="submit"
                    className="btn btn-link text-primary"
                    disabled={!newMessage.trim() || isSending}
                >
                    {isSending ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        <SendIcon />
                    )}
                </button>
            </form>
        </div>
    );
};

export default MessageInput;