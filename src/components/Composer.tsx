import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useStore } from '../lib/store';
import { sendMessage } from '../lib/agent';
import { Icon } from '../lib/icons';
import { QuickActionChip } from './QuickActionChip';
import { VoiceWaveform } from './VoiceWaveform';
import './Composer.css';

const CHIPS: { label: string; icon: string; text: string }[] = [
  { label: 'New event', icon: 'plus', text: 'Schedule lunch Friday at 1pm' },
  { label: 'Send message', icon: 'email', text: "Message Anna that I'm running late" },
  { label: 'Dashboard', icon: 'list', text: 'Create a dashboard of my weekly spending' },
  { label: 'Check calendar', icon: 'calendar', text: 'Check my calendar this week' },
  { label: 'Summarise', icon: 'bubble', text: 'Summarise my week' },
];

const VOICE_TRANSCRIPT = 'Create a dashboard of my weekly spending';
const VOICE_DELAY_MS = 1400;

export function Composer() {
  const toolStatus = useStore((s) => s.toolStatus);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showChips = !toolStatus && !recording;
  const hasText = text.trim().length > 0;

  const send = () => {
    const value = text.trim();
    if (!value) return;
    sendMessage(value);
    setText('');
    setSelected(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleChip = (label: string, value: string) => {
    sendMessage(value);
    setText('');
    setSelected(label);
  };

  // Voice: insert a transcript after ~1400ms; never auto-send.
  useEffect(() => {
    if (!recording) return;
    const t = window.setTimeout(() => {
      setText((prev) =>
        prev.trim() ? `${prev.trimEnd()} ${VOICE_TRANSCRIPT}` : VOICE_TRANSCRIPT,
      );
      setRecording(false);
    }, VOICE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [recording]);

  // Grow the field 1–5 lines as content changes.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text, recording]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="composer">
      {showChips ? (
        <div className="composer__chips" role="group" aria-label="Quick actions">
          {CHIPS.map((chip) => (
            <QuickActionChip
              key={chip.label}
              label={chip.label}
              icon={chip.icon}
              selected={selected === chip.label}
              onClick={() => handleChip(chip.label, chip.text)}
            />
          ))}
        </div>
      ) : null}

      {recording ? (
        <div className="composer__recording">
          <VoiceWaveform active />
          <span className="composer__listening">Listening</span>
          <button
            type="button"
            className="composer__cancel"
            onClick={() => setRecording(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="composer__input-row">
          <textarea
            ref={textareaRef}
            className="composer__field"
            rows={1}
            value={text}
            placeholder="Ask or tell the agent…"
            aria-label="Message the assistant"
            onChange={(e) => {
              setText(e.target.value);
              setSelected(null);
            }}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="composer__mic"
            aria-label="Dictate a message"
            onClick={() => setRecording(true)}
          >
            <Icon name="mic" size={18} />
          </button>
          {hasText ? (
            <button
              type="button"
              className="composer__send"
              aria-label="Send message"
              onClick={send}
            >
              <Icon name="send" size={18} />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
