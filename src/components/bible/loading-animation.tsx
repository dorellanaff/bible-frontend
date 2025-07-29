"use client"

import React from 'react';

export function LoadingAnimation() {
  return (
    <div className="book-loading-container">
      <div className="book">
        <div className="book__pg-shadow"></div>
        <div className="book__pg"></div>
        <div className="book__pg book__pg--2"></div>
        <div className="book__pg book__pg--3"></div>
        <div className="book__pg book__pg--4"></div>
        <div className="book__pg book__pg--5"></div>
      </div>
      <h2 className="text-2xl font-headline text-primary mt-28">Cargando...</h2>
    </div>
  );
}
