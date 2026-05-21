import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SingleCard } from './layouts';
import { LoginForm } from './components';
import Home from './pages/home/home';

export const UnauthenticatedContent = () => {
  return (
    <Routes>
      <Route
        path='/login'
        element={
          <SingleCard title='Sign In'>
            <LoginForm
              resetLink='/reset-password'
            />
          </SingleCard>
        }
      />
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path='*' element={<Navigate to='/login' />} />
    </Routes>
  );
};
