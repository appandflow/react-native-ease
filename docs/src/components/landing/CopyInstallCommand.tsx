import React, { useEffect, useRef, useState } from 'react';
import styles from '../../css/landing.module.css';
import Illustration from './Illustration';

export default function CopyInstallCommand({
  command,
}: {
  command: string;
}): React.ReactElement {
  const [status, setStatus] = useState('');
  const copied = status === 'Copied';
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(command);
      setStatus('Copied');
      timer.current = setTimeout(() => setStatus(''), 2000);
    } catch {
      setStatus('Select the command and copy it manually.');
    }
  }

  return (
    <div className={styles.install} data-copied={copied}>
      <div className={styles.installRow}>
        <code className={styles.command}>{command}</code>
        <button
          type="button"
          className={styles.copyButton}
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy install command'}
          title={copied ? 'Copied' : 'Copy install command'}
        >
          <span aria-hidden="true" className={styles.copyIcons}>
            <Illustration
              file="copy.svg"
              width={12}
              height={12}
              className={styles.copyIcon}
            />
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              className={styles.checkIcon}
            >
              <path
                fill="currentColor"
                d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
              />
            </svg>
          </span>
        </button>
      </div>
      <output
        aria-live="polite"
        className={copied ? styles.srOnly : styles.copyStatus}
      >
        {status}
      </output>
    </div>
  );
}
