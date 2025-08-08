import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function AdminDashboard() {
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        const fetchAllBookings = async () => {
            try {
                const response = await api.get('/all-bookings');
                setBookings(response.data);
            } catch (err) {
                setError('Failed to fetch bookings.');
            }
        };
        fetchAllBookings();
    }, []);

    return (
        <div>
            <h1>Admin Dashboard - All Bookings</h1>
            <button onClick={logout}>Logout</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <table>
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>Patient Email</th>
                        <th>Appointment Time</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking.id}>
                            <td>{booking.user.name}</td>
                            <td>{booking.user.email}</td>
                            <td>{new Date(booking.slot.start_at).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminDashboard;