import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import LoginPage from './LoginPage';

const isLoggedIn = localStorage.getItem('isLoggedIn');

ReactDOM.render(
  <React.StrictMode>
    {isLoggedIn ? <App /> : <LoginPage />}
  </React.StrictMode>,
  document.getElementById('root')
);
