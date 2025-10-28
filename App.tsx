
import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen w-full bg-background font-sans text-foreground">
      <main className="space-y-6 bg-gradient-to-b from-background via-background/80 to-background/60 p-4 sm:p-8">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
