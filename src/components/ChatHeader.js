import React from 'react';
import Avatar from './Avatar';
import {BackIcon, MenuIcon, MoreVerticalIcon, PhoneIcon, SearchIcon} from './Icons';

const ChatHeader = ({ chat, currentUser, toggleSidebar, typingStatusList, isMobileView, showSidebar }) => {

    const chatName = chat.display_name;
    let typingStatus = "last seen recently";

    if (chat.type === "private"){
        for (const x of typingStatusList) {
            if (x.typing_status.username !== currentUser.username) {
                typingStatus = x.typing_status.status;
            }
        }
    } else {
        typingStatus = "group";
        let statuses = [];

        for (const x of typingStatusList) {
            if (x.typing_status.username !== currentUser.username && x.typing_status.status !== "last seen recently") {
                statuses.push(currentUser.first_name + " is " + x.typing_status.status);
            }

            if (statuses.length === 2) {
                break;
            }
        }

        if (statuses.length > 0) {
            typingStatus = "";
            for (const x of statuses) {
                typingStatus += x + ", ";
            }
            typingStatus = typingStatus.substr(0, typingStatus.length - 2);
        }

    }


    return (
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white w-100 chat-header">
            <div className="d-flex align-items-center">
                {isMobileView && (
                    <button
                        className="btn btn-light btn-sm rounded-circle me-2"
                        onClick={toggleSidebar}
                        aria-label={showSidebar ? "Close sidebar" : "Back to chat list"}
                    >
                        {showSidebar ? <MenuIcon /> : <BackIcon />}
                    </button>
                )}
                <Avatar name={chatName} />
                <div className="ms-3">
                    <div className="fw-medium">{chatName}</div>
                    <div className="small text-muted">{typingStatus}</div>
                </div>
            </div>
            <div className="d-flex">
                <button className="btn btn-light btn-sm rounded-circle mx-1 d-none d-md-block">
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