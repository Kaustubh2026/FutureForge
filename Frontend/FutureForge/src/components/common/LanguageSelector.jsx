import React, { useEffect, useRef } from 'react';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const translateElementRef = useRef(null);

  useEffect(() => {
    // Ensure Google Translate elements are removed first
    const existingScript = document.getElementById('google-translate-script');
    if (existingScript) {
      document.body.removeChild(existingScript);
    }
    
    // Define the callback function
    window.googleTranslateElementInit = function() {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'ar,bn,zh-CN,nl,en,fr,de,hi,it,ja,ko,pt,ru,es,tr',
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        },
        'google_translate_element'
      );
      
      // After initialization, clean up the UI
      setTimeout(() => {
        cleanupGoogleTranslateUI();
      }, 1000);
    };
    
    // Load Google Translate script
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
    
    // Cleanup function
    return () => {
      if (document.getElementById('google-translate-script')) {
        document.body.removeChild(document.getElementById('google-translate-script'));
      }
      delete window.googleTranslateElementInit;
    };
  }, []);

  // Clean up Google Translate UI after it's injected
  const cleanupGoogleTranslateUI = () => {
    const selectElement = document.querySelector('.goog-te-combo');
    if (selectElement) {
      // Add custom placeholder
      if (selectElement.options[0].text === 'Select Language') {
        selectElement.options[0].text = 'Language';
      }
      
      // Add a visual cue for dropdown
      const parent = selectElement.parentElement;
      if (parent && !parent.querySelector('.dropdown-icon')) {
        const icon = document.createElement('span');
        icon.className = 'dropdown-icon';
        icon.innerHTML = '▼';
        parent.appendChild(icon);
      }
    }
  };

  return (
    <div className="language-selector-container" ref={translateElementRef}>
      <div id="google_translate_element"></div>
    </div>
  );
};

export default LanguageSelector; 