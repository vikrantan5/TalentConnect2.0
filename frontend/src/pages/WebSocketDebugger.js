import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/apiService';

const WebSocketDebugger = () => {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState([]);
  const [myExchanges, setMyExchanges] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [marketplace, mine] = await Promise.all([
        taskService.getSkillExchangeTasks('open'),
        taskService.getMySkillExchangeTasks(),
      ]);
      setExchanges(marketplace);
      setMyExchanges(mine);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WebSocket Chat Debugger</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
          <h2 className="font-bold text-lg mb-2">🔍 Current User Info</h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📋 Marketplace Exchanges</h2>
            <div className="space-y-4">
              {exchanges.map(task => (
                <div key={task.id} className="border rounded p-4 bg-gray-50">
                  <div className="font-mono text-xs text-gray-500 mb-2">
                    ID: {task.id}
                  </div>
                  <div className="font-semibold">
                    {task.skill_offered} ↔ {task.skill_requested}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Creator: {task.creator_id}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {task.status}
                  </div>
                  {task.acceptor_id && (
                    <div className="text-sm text-gray-600">
                      Acceptor: {task.acceptor_id}
                    </div>
                  )}
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                    <strong>Room ID for Chat:</strong> {task.id}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">✅ My Exchanges</h2>
            <div className="space-y-4">
              {myExchanges.map(task => (
                <div key={task.id} className="border rounded p-4 bg-gray-50">
                  <div className="font-mono text-xs text-gray-500 mb-2">
                    ID: {task.id}
                  </div>
                  <div className="font-semibold">
                    {task.skill_offered} ↔ {task.skill_requested}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Creator: {task.creator_id}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {task.status}
                  </div>
                  {task.acceptor_id && (
                    <div className="text-sm text-gray-600">
                      Acceptor: {task.acceptor_id}
                    </div>
                  )}
                  <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                    <strong>Room ID for Chat:</strong> {task.id}
                  </div>
                  <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                    <strong>Am I Creator?</strong> {task.creator_id === user?.id ? 'YES' : 'NO'}
                    <br />
                    <strong>Am I Acceptor?</strong> {task.acceptor_id === user?.id ? 'YES' : 'NO'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 p-6">
          <h2 className="font-bold text-lg mb-4">⚠️ DEBUGGING CHECKLIST</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Both users must click "Chat" on a task with the <strong>SAME ID</strong></li>
            <li>If Creator creates task with ID "abc-123", Acceptor must also see ID "abc-123"</li>
            <li>Check the "Room ID for Chat" above - it must be IDENTICAL for both users</li>
            <li>Open console (F12) and verify WebSocket connects to:
              <code className="block bg-gray-800 text-green-400 p-2 mt-2 rounded">
                ws://127.0.0.1:8000/api/realtime/ws/exchange/SAME-ID?token=...
              </code>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default WebSocketDebugger;
