import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EnhancedShipmentForm from './pages/EnhancedShipmentForm';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipments/edit/:id" element={<EnhancedShipmentForm />} />
          <Route path="/shipments/daily" element={<EnhancedShipmentForm />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
