import React from 'react';
import Avatar from './Avatar';
import { SearchIcon, PhoneIcon, MoreVerticalIcon } from './Icons';

const ChatHeader = ({ chat, currentUser }) => {
    const getChatName = () => {
        if (!chat || !chat.last_message || !currentUser) return 'Loading...';

        // For now, we'll use the sender name from last message
        // In a real app, you'd want to get the actual chat name or participant name
        const lastMessageSender = chat.last_message.sender_username;
        return lastMessageSender === currentUser.username
            ? `Chat ${chat.id}` // Replace with actual recipient name when API provides it
            : chat.last_message.sender_name;
    };

    const chatName = getChatName();

    return (
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
            <div className="d-flex align-items-center">
                <Avatar name={chatName} />
                <div className="ms-3">
                    <div className="fw-medium">{chatName}</div>
                    <div className="small text-muted">last seen recently</div>
                </div>
            </div>
            <div className="d-flex">
                <button className="btn btn-light btn-sm rounded-circle mx-1">
                    <SearchIcon />
                </button>
                <button className="btn btn-light btn-sm rounded-circle mx-1">
                    <PhoneIcon />
                </button>
                <button className="btn btn-light btn-sm rounded-circle mx-1">
                    <MoreVerticalIcon />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;