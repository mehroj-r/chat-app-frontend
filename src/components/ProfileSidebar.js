import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';

const ProfileSidebar = ({ user, logout, onClose }) => {
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                setLoading(true);
                // Using the existing user info endpoint, but you can create a more detailed one
                const response = await axios.get(`${API_BASE_URL}/me/`);
                setUserDetails(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user details:', error);
                setLoading(false);
            }
        };

        if (user) {
            fetchUserDetails();
        }
    }, [user]);

    return (
        <div className="d-flex flex-column h-100">
            {/* Header */}
            <div className="d-flex align-items-center p-3 border-bottom">
                <button className="btn btn-light btn-sm" onClick={onClose}>
                    <i className="bi bi-arrow-left"></i>
                </button>
                <h5 className="mb-0 ms-3">Profile</h5>
            </div>

            {/* Profile Content */}
            <div className="p-4">
                {loading ? (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-row items-center justify-center mb-4" style={{ display: 'flex', flexDirection: 'row' }}>
                            <div className="mr-3" style={{ display: 'inline-block' }}>
                                <Avatar name={user?.username} />
                            </div>
                            <div style={{ display: 'inline-block', width: '40px', margin: '10px 10px 10px 15px' }}>
                                <h4>{user?.first_name}</h4>
                            </div>
                        </div>

                        <div className="card mb-4">
                            <div className="card-body">
                                <div className="mb-2">
                                    <strong>Username:</strong> {userDetails?.username}
                                </div>
                                {userDetails?.email && (
                                    <div className="mb-2">
                                        <strong>Email:</strong> {userDetails.email}
                                    </div>
                                )}
                                {userDetails?.first_name && (
                                    <div className="mb-2">
                                        <strong>First Name:</strong> {userDetails.first_name}
                                    </div>
                                )}
                                {userDetails?.last_name && (
                                    <div className="mb-2">
                                        <strong>Last Name:</strong> {userDetails.last_name}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-grid">
                            <button className="btn btn-danger" onClick={logout}>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Logout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfileSidebar;