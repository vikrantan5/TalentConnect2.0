import React, { useEffect, useRef, useState } from 'react';

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver;

    const renderButton = () => {
      if (!window.google?.accounts?.id || !buttonContainerRef.current) return;
      // Use a fixed sane width — reading offsetWidth at first mount can be 0,
      // which breaks the rendered iframe click target on some browsers.
      const width = Math.max(buttonContainerRef.current.offsetWidth || 320, 240);
      buttonContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width,
      });
      setReady(true);
    };

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
          itp_support: true,
          use_fedcm_for_prompt: false,
        });

        renderButton();

        // Re-render on container resize so the button never has a 0-width click target.
        if (window.ResizeObserver && buttonContainerRef.current) {
          resizeObserver = new ResizeObserver(() => renderButton());
          resizeObserver.observe(buttonContainerRef.current);
        }
      } catch (e) {
        if (onError) onError('Failed to load Google Sign-In');
      }
    };
    init();
    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [onCredential, onError]);

  // Fallback: trigger Google One Tap prompt if the rendered iframe ever fails to click.
  const handleFallbackClick = () => {
    try {
      if (window.google?.accounts?.id?.prompt) {
        window.google.accounts.id.prompt();
      }
    } catch (_) { /* no-op */ }
  };

  return (
    <div className="w-full" onClick={!ready ? handleFallbackClick : undefined}>
      <div
        ref={buttonContainerRef}
        data-testid={testId}
        aria-label={label}
        className="w-full flex justify-center items-center min-h-[44px]"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
};

export default GoogleAuthButton;
