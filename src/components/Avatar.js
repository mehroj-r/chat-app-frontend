import React from 'react';

const Avatar = ({ name = 'User' }) => {
    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const initial = getInitial(name);
    const colors = ['#007bff', '#6f42c1', '#e83e8c', '#fd7e14', '#28a745', '#20c997', '#17a2b8', '#6c757d'];
    const colorIndex = name ? name.length % colors.length : 0;

    return (
        <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white overflow-hidden"
            style={{
                width: '48px',
                height: '48px',
                backgroundColor: colors[colorIndex],
                fontSize: '18px'
            }}
        >
            {initial}
        </div>
    );
};

export default Avatar;