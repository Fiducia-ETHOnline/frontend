import React, { useState } from 'react';
import axios from 'axios';
import { FaArrowUp } from "react-icons/fa6";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const API_BASE_URL = '/api';

const Chatbot: React.FC = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async () => {
        if (input.trim() === '' || loading) return;

        setLoading(true);
        setError(null);
        console.log('Sending message to API:', input);

        try {
            const token = localStorage.getItem('fiducia_jwt');
            if (!token) {
                setError('Please sign in to start a conversation.');
                setLoading(false);
                return;
            }

            const response = await axios.post(
                `${API_BASE_URL}/chat/messages`,
                { text: input },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Received API response:', response.data);
            alert('Message sent successfully! Check the console for the response.');
            setInput('');

        } catch (err) {
            console.error('Chatbot error:', err);
            setError('Failed to send message. Please check the console and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-container">

            <div className="message-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') sendMessage();
                    }}
                    placeholder="Ask me to book a table, order a pizza, etc."
                    disabled={loading}
                />
                <button onClick={sendMessage} disabled={loading}>
                    {loading ? <AiOutlineLoading3Quarters /> : <FaArrowUp />}
                </button>
            </div>
            {error && <p className="chatbot-error">{error}</p>}
        </div>
    );
};

export default Chatbot;