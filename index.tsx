
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { User } from './types';
import { LoginForm } from './components/LoginForm';
import { LandingPage } from './components/LandingPage';

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return <LandingPage user={user} onLogout={() => setUser(null)} />;
};

const rootNode = document.getElementById('root');
if (rootNode) {
  const root = createRoot(rootNode);
  root.render(<App />);
}
