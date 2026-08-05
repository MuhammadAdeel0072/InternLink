import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import styles from './CandidateNotes.module.css';

const CandidateNotes = ({ notes = [], onAddNote, onDeleteNote, readonly = false }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef();

  useEffect(() => {
    if (!readonly && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [readonly]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddNote && onAddNote(text.trim());
    setText('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.notesContainer}>
      <div className={styles.notesHeader}>
        <h4 className={styles.notesTitle}>Private Notes</h4>
        <span className={styles.notesCount}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
      </div>

      <div className={styles.notesList}>
        {notes.length === 0 && (
          <p className={styles.noNotes}>No notes yet. Add a private note about this candidate.</p>
        )}
        {notes.map((note, index) => (
          <div key={index} className={styles.noteItem}>
            <div className={styles.noteHeader}>
              <span className={styles.noteDate}>{formatDate(note.date)}</span>
              {!readonly && (
                <button
                  type="button"
                  onClick={() => onDeleteNote && onDeleteNote(index)}
                  className={styles.deleteBtn}
                  aria-label="Delete note"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className={styles.noteText}>{note.text}</p>
          </div>
        ))}
      </div>

      {!readonly && (
        <form onSubmit={handleSubmit} className={styles.addNoteForm}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a private note..."
            rows={2}
            className={styles.noteTextarea}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className={styles.submitBtn}
          >
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
};

export default CandidateNotes;
