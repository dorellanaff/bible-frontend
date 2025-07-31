
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
      <div className="text-center mt-8">
        <h2 className="text-4xl font-display text-primary">
          Lamp
        </h2>
        <p className="text-lg text-muted-foreground mt-2 font-headline">
          Salmos 119:105{dots}
        </p>
      </div>
    </div>
  );
}
