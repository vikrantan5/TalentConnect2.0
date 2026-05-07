import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, Video, User, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CalendarWidget = ({ userId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/sessions/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const upcoming = response.data.filter(session => {
        const sessionDate = new Date(session.scheduled_time);
        return sessionDate >= new Date() && session.status !== 'cancelled';
      });
      setSessions(upcoming);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
    setLoading(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay(), year, month };
  };

  const getSessionsForDate = (date) => sessions.filter(session => {
    const d = new Date(session.scheduled_time);
    return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
  });

  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) days.push(day);

  if (loading) {
    return (
      <div className="bento p-7" data-testid="calendar-widget">
        <div className="flex items-center justify-center py-10">
          <div className="tc-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="bento p-7" data-testid="calendar-widget">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <span className="chip chip-cyan mb-2"><Sparkles className="w-3 h-3" /> calendar</span>
          <h3 className="font-display text-2xl flex items-center gap-2">
            My <span className="italic text-gradient-cyan">calendar</span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={previousMonth} className="w-8 h-8 rounded-full glass grid place-items-center hover:shadow-glow transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full glass grid place-items-center hover:shadow-glow transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[10px] uppercase tracking-widest font-semibold text-ink-500 dark:text-ink-300 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
          const date = new Date(year, month, day);
          const sessionsForDay = getSessionsForDate(date);
          const today = new Date();
          const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
          const isSelected = selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(date)}
              className={`aspect-square rounded-xl text-sm font-semibold transition-all relative grid place-items-center ${
                isToday
                  ? 'bg-ink-950 text-cyan-300 ring-1 ring-white/10 shadow-soft'
                  : isSelected
                    ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30 text-cyan-700 dark:text-cyan-300'
                    : 'hover:bg-white/60 dark:hover:bg-white/5 text-ink-700 dark:text-ink-200'
              }`}
            >
              {day}
              {sessionsForDay.length > 0 && (
                <div className="absolute bottom-1.5 flex gap-0.5">
                  {sessionsForDay.slice(0, 3).map((_, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${isToday ? 'bg-cyan-300' : 'bg-coral-500'}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date sessions */}
      {selectedDate && (
        <div className="mt-5 pt-5 border-t border-black/5 dark:border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
          {getSessionsForDate(selectedDate).length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-300">No sessions scheduled</p>
          ) : (
            <div className="space-y-2">
              {getSessionsForDate(selectedDate).map((session, index) => (
                <div key={index} className="rounded-2xl glass p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm">{session.skill_name || 'Session'}</p>
                    <span className={`chip ${session.status === 'confirmed' ? 'chip-cyan' : 'chip-coral'}`}>{session.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-500 dark:text-ink-300 flex-wrap">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />
                      {new Date(session.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {session.duration && ` · ${session.duration} min`}
                    </span>
                    {(session.mentor_username || session.mentee_username) && (
                      <span className="flex items-center gap-1.5"><User className="w-3 h-3" />@{session.mentor_username || session.mentee_username}</span>
                    )}
                  </div>
                  {session.meeting_link && (
                    <a href={session.meeting_link} target="_blank" rel="noopener noreferrer"
                       className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-300 font-semibold hover:underline">
                      <Video className="w-3 h-3" /> Join meeting
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming */}
      {sessions.length > 0 && !selectedDate && (
        <div className="mt-5 pt-5 border-t border-black/5 dark:border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3 flex items-center gap-2">
            <CalendarIcon className="w-3 h-3" /> Upcoming · {sessions.length}
          </p>
          <div className="space-y-2">
            {sessions.slice(0, 3).map((session, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl glass p-3 text-sm">
                <span className="font-semibold truncate">{session.skill_name || 'Session'}</span>
                <span className="text-xs text-ink-500 dark:text-ink-300 flex-shrink-0 ml-3">
                  {new Date(session.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;
