import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function PatientDashboard() {
    const [slots, setSlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [error, setError] = useState('');
    const { logout } = useContext(AuthContext);

    // Fetch available slots and user's bookings
    const fetchData = async () => {
        try {
            const [slotsRes, bookingsRes] = await Promise.all([
                api.get('/slots'),
                api.get('/my-bookings')
            ]);
            setSlots(slotsRes.data);
            setMyBookings(bookingsRes.data);
        } catch (err) {
            setError('Failed to fetch data.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBookSlot = async (slotId) => {
        try {
            await api.post('/book', { slotId });
            alert('Slot booked successfully!');
            fetchData(); // Refresh data after booking
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to book slot.'); // [cite: 46, 29]
        }
    };

    return (
        <div>
            <h1>Patient Dashboard</h1>
            <button onClick={logout}>Logout</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h2>Available Slots</h2>
            <ul>
                {slots.map(slot => (
                    <li key={slot.id}>
                        {new Date(slot.start_at).toLocaleString()}
                        <button onClick={() => handleBookSlot(slot.id)}>Book</button>
                    </li>
                ))}
            </ul>

            <h2>My Bookings</h2>
            <ul>
                {myBookings.map(booking => (
                    <li key={booking.id}>
                        {new Date(booking.slot.start_at).toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PatientDashboard;