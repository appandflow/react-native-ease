import React, { useEffect, useRef, useState } from 'react';
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
    <div style={{ position: 'relative', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <code
          style={{
            padding: 0,
            border: 0,
            background: 'transparent',
            color: '#828282',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            overflowWrap: 'anywhere',
          }}
        >
          {command}
        </code>
        <button
          type="button"
          className="ease-copy-button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy install command'}
          title={copied ? 'Copied' : 'Copy install command'}
          style={{
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            width: 32,
            height: 32,
            padding: 8,
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            color: '#008cff',
          }}
        >
          <span
            aria-hidden="true"
            style={{ display: 'grid', width: 16, height: 16 }}
          >
            <Illustration
              file="copy.svg"
              width={12}
              height={12}
              style={{
                gridArea: '1 / 1',
                placeSelf: 'center',
                opacity: copied ? 0 : 1,
                transform: copied ? 'scale(0.33)' : 'scale(1)',
                transition: 'all var(--ifm-transition-fast) ease',
              }}
            />
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              style={{
                gridArea: '1 / 1',
                color: '#00d600',
                opacity: copied ? 1 : 0,
                transform: copied ? 'scale(1)' : 'scale(0.33)',
                transition: 'all var(--ifm-transition-fast) ease',
                transitionDelay: copied ? '75ms' : '0ms',
              }}
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
        style={
          copied
            ? {
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                clipPath: 'inset(50%)',
                whiteSpace: 'nowrap',
              }
            : {
                position: 'absolute',
                top: '100%',
                left: 0,
                fontSize: 11,
                color: '#59677f',
              }
        }
      >
        {status}
      </output>
    </div>
  );
}
