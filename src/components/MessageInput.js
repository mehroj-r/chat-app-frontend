import React, { useState } from 'react';
import { SmileIcon, SendIcon } from './Icons';

const MessageInput = ({ onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

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

    return (
        <div className="p-3 border-top mt-auto">
            <form onSubmit={handleSubmit} className="d-flex align-items-center">
                <button type="button" className="btn btn-light btn-sm rounded-circle">
                    <SmileIcon />
                </button>
                <input
                    type="text"
                    placeholder="Message"
                    className="form-control mx-2 rounded-pill"
                    value={newMessage}
                    onChange={handleInputChange}
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