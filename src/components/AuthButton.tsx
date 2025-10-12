import React, { useState, useEffect } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useSignMessage } from 'wagmi';
import axios from 'axios';

const API_BASE_URL = '/api';

interface AuthInfo {
    token: string;
    address: string;
    role: 'customer' | 'merchant';
}

const AuthButton: React.FC = () => {
    const { address, isConnected, isDisconnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            const storedToken = localStorage.getItem('fiducia_jwt');
            if (storedToken && address) {
                try {
                    setAuthInfo({ token: storedToken, address, role: 'customer' });
                    console.log('Session restored for:', address);
                } catch (err) {
                    console.error('Session validation failed', err);
                    localStorage.removeItem('fiducia_jwt');
                    setAuthInfo(null);
                }
            }
        };
        checkSession();
    }, [address]);

    const handleLogin = async () => {
        if (!address) {
            setError('Please connect your wallet first.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const challengeResponse = await axios.get(`${API_BASE_URL}/auth/challenge`, {
                params: { address },
            });
            const message = challengeResponse.data.message;
            console.log('Received challenge message:', message);

            const signature = await signMessageAsync({ message });
            console.log('Signed message:', signature);

            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                address,
                signature,
            });
            const { token, user } = loginResponse.data;

            setAuthInfo({ token, address: user.address, role: user.role });
            localStorage.setItem('fiducia_jwt', token);
            console.log('Login successful!', user);

        } catch (err) {
            console.error('Login failed:', err);
            setError('Login failed. Please try again or check console for details.');
            localStorage.removeItem('fiducia_jwt');
            setAuthInfo(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setAuthInfo(null);
        localStorage.removeItem('fiducia_jwt');
        console.log('Logged out.');
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ConnectKitButton />
            {isConnected && !authInfo && (
                <button onClick={handleLogin} disabled={loading}>
                    {loading ? 'Logging in...' : 'Sign In with Wallet'}
                </button>
            )}
            {authInfo && (
                <>
                    <span>{authInfo.address.substring(0, 6)}... ({authInfo.role})</span>
                    <button onClick={handleLogout}>Logout</button>
                </>
            )}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {isDisconnected && <p>Please connect your wallet.</p>}
        </div>
    );
};

export default AuthButton;