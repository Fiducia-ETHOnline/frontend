import './App.scss';
import AuthButton from './components/AuthButton.tsx';
import Chatbot from './components/Chatbot.tsx';

function App() {
    return (
        <div className="app-layout">
            <header className="header">
                <div className="logo">
                    <h1>Fiducia</h1>
                </div>
                <div className="auth-area">
                    <AuthButton />
                </div>
            </header>

            <main className="main-content">
                <Chatbot />
            </main>

            <footer className="footer">
                <p>
                    &copy; 2025 Fiducia. All rights reserved.
                </p>
            </footer>
        </div>
    );
}

export default App;