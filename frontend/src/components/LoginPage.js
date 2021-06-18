import React, { Component, useState, useEffect } from "react";
import { render } from "react-dom";
import DjangoCSRFToken from 'django-react-csrftoken'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect( () => {
    if (localStorage.getItem('token') !== null) {
      window.location.replace('http://localhost:3000/dashboard');
    } else {
      setLoading(false);
    }
  }, []); //call only on initial renders

    const handleSubmit = e => {
    e.preventDefault();

    const user = {
      email: email,
      password: password
    };

    //sending request via POST to url
    fetch('http://127.0.0.1:8000/api/lead/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user) //user is passed in json
    })

    //turning response body into json and writing it to data
    .then(res => res.json())
      .then(data => {
        if (data.key) {
          localStorage.clear();
          localStorage.setItem('token', data.key);
          window.location.replace('http://localhost:8000/dashboard');
        } else {
          setEmail('');
          setPassword('');
          localStorage.clear();
          setErrors(true);

        }
      });

  };

     return (
    <div>
      <h1>Signin</h1>
      {errors === true && <h2>Cannot signup with provided credentials</h2>}
      {loading === false && (
        <form onSubmit={handleSubmit}>
          <label htmlFor='email'>Email address:</label> <br />
          <input
            name='email'
            type='email'
            value={email}
            required
            onChange={e => setEmail(e.target.value)}
          />{' '}
          <br />
          <label htmlFor='password'>Password:</label> <br />
          <input
            name='password'
            type='password'
            value={password}
            required
            onChange={e => setPassword(e.target.value)}
          />{' '}
          <br />
          <input type='submit' value='Login' />
        </form>
      )}
    </div>
  );
};
export default Login;