
"use client"

import React, { useState, useEffect } from 'react';

export function LoadingAnimation() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 4) {
          return '';
        }
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      <div className="circular-progress"></div>
      <h2 className="text-2xl font-display text-primary mt-8">
        Una biblia para ti{dots}
      </h2>
    </div>
  );
}
