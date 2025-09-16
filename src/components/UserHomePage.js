import React from 'react';
import HomePage from './HomePage';

const UserHomePage = ({ onLogout }) => {
  return <HomePage variant="user" onLogout={onLogout} />;
};

export default UserHomePage;


