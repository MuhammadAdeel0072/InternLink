import React from 'react';
import styles from './CalendarView.module.css';
import StatusBadge from '../StatusBadge/StatusBadge';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = ({ interviews, onDateSelect, selectedDate, currentDate, onMonthChange }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push({ day: null, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split('T')[0];
    const dayInterviews = interviews.filter(iv => {
      const ivDate = new Date(iv.date);
      return ivDate.toISOString().split('T')[0] === dateStr;
    });
    days.push({
      day: d,
      date: date,
      isToday: isCurrentMonth && d === today.getDate(),
      isSelected:
        selectedDate &&
        selectedDate.toISOString().split('T')[0] === dateStr,
      interviews: dayInterviews
    });
  }

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate);
  };

  const handleDayClick = (dayObj) => {
    if (dayObj.date) {
      onDateSelect(dayObj.date);
    }
  };

  const getInterviewColor = (status) => {
    const colors = {
      scheduled: 'var(--primary)',
      'pending-confirmation': 'var(--warning)',
      confirmed: 'var(--success)',
      rescheduled: '#8b5cf6',
      completed: 'var(--info)',
      cancelled: 'var(--danger)',
      'no-show': '#f87171'
    };
    return colors[status] || 'var(--text-muted)';
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button
          className={styles.navButton}
          onClick={prevMonth}
          aria-label="Previous month"
        >
          &#8249;
        </button>
        <div className={styles.monthYear}>
          <span className={styles.month}>{MONTH_NAMES[month]}</span>
          <span className={styles.year}>{year}</span>
        </div>
        <button
          className={styles.navButton}
          onClick={nextMonth}
          aria-label="Next month"
        >
          &#8250;
        </button>
      </div>

      <div className={styles.weekDays}>
        {DAY_NAMES.map(day => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.daysGrid}>
        {days.map((dayObj, idx) => (
          <div
            key={idx}
            className={`
              ${styles.dayCell}
              ${dayObj.isToday ? styles.today : ''}
              ${dayObj.isSelected ? styles.selected : ''}
              ${!dayObj.date ? styles.empty : ''}
            `}
            onClick={() => handleDayClick(dayObj)}
          >
            {dayObj.date && (
              <>
                <span className={styles.dayNumber}>{dayObj.day}</span>
                <div className={styles.interviewIndicators}>
                  {dayObj.interviews.slice(0, 3).map(iv => (
                    <div
                      key={iv._id}
                      className={styles.interviewIndicator}
                      style={{
                        backgroundColor: getInterviewColor(iv.status),
                        color: 'white'
                      }}
                      title={`${iv.candidateId?.name || 'Candidate'} - ${iv.jobId?.title || 'Job'}`}
                    >
                      <span className={styles.indicatorDot}></span>
                      <span className={styles.indicatorTime}>{iv.time}</span>
                    </div>
                  ))}
                  {dayObj.interviews.length > 3 && (
                    <div className={styles.moreIndicator}>
                      +{dayObj.interviews.length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
