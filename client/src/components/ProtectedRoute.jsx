import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
    const { auth } = useContext(AuthContext);

    if (!auth.token) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
        return <Navigate to="/login" />; // Or an "unauthorized" page
    }

    return children;
}

export default ProtectedRoute;