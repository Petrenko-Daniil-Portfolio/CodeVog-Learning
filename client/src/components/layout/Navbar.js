import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState('');

  useEffect(() => {
    if (localStorage.getItem('token') !== null) {
      setIsAuth(true);
      //Get user
      fetch('http://127.0.0.1:8000/api/lead/auth/user/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          fetch('http://127.0.0.1:8000/api/lead/'+data.pk, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${localStorage.getItem('token')}`
            }
          })
            .then(res => res.json())
            .then(data => {
                setUser(data);

            })

        });
    }

  }, []);

  return (
    <nav>
      <h1>Django React Auth</h1>
      <ul>
        {isAuth === true ? (
          <Fragment>
            {' '}
            <li>
                {user.is_staff === true ? (
                    <Link to='/dashboard'>Clients</Link>
                ) : (

                    <Link to='/dashboard'>Financial Instruments</Link>
                    )
                }

            </li>
            <li>
              <Link to='/logout'>Logout</Link>
            </li>
          </Fragment>
        ) : (
          <Fragment>
            {' '}
            <li>
              <Link to='/login'>Login</Link>
            </li>
          </Fragment>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;