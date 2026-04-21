import React, { useEffect, useRef } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });

const GoogleAuthButton = ({ onCredential, onError, label = 'Continue with Google', testId = 'google-auth-button' }) => {
  const buttonContainerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (!GOOGLE_CLIENT_ID) {
          if (onError) onError('Google Client ID not configured');
          return;
        }
        await loadGoogleScript();
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential && onCredential) {
              onCredential(response.credential);
            }
          },
          ux_mode: 'popup',
          auto_select: false,
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: buttonContainerRef.current.offsetWidth || 280,
          });
        }
      } catch (e) {
        if (onError) onError('Failed to load Google Sign-In');
      }
    };
    init();
    return () => { cancelled = true; };
  }, [onCredential, onError]);

  return (
    <div className="w-full">
      <div
        ref={buttonContainerRef}
        data-testid={testId}
        aria-label={label}
        className="w-full flex justify-center"
      />
    </div>
  );
};

export default GoogleAuthButton;
