import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Phone = () => {
    const [isOptedIn, setIsOptedIn] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const navigate = useNavigate();
  const handleSubmit = (e) => {
    
    e.preventDefault();
    if (isOptedIn && phoneNumber.trim() !== '') {
        alert(`Phone number ${phoneNumber} has been submitted for text messages.`);
        navigate('/main');    
    } else if (!isOptedIn) {
      alert('Please opt in to receive text messages.');
    } else {
      alert('Please enter a valid phone number.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Opt-In Form</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={isOptedIn}
              onChange={(e) => setIsOptedIn(e.target.checked)}
            />
            Opt-In to receive text messages from CourseX
          </label>
        </div>

        {isOptedIn && (
          <div style={{ marginBottom: '10px' }}>
            <label>
              Phone Number:
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                style={{ marginLeft: '10px', padding: '5px' }}
              />
            </label>
          </div>
        )}

        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Submit
        </button>
      </form>
    </div>
  );
}

export default Phone;