import React from 'react';
import { CalendarCheck } from 'lucide-react';

export const Header: React.FC<{ fileName?: string }> = ({ fileName = 'tasks.tcal' }) => (
  <header style={{ height: '50px', backgroundColor: '#252526', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #3c3c3c' }}>
    <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#cccccc', display: 'flex', alignItems: 'center', gap: 10 }}>
      <CalendarCheck size={22} color="#007acc" />
      Task Calendar
    </h1>
    <span style={{ fontSize: '12px', color: '#666666' }}>{fileName}</span>
  </header>
);
