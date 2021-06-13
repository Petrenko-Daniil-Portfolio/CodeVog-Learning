import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

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
  <Fragment>
    <div className="h-100 flex-shrink-0 p-3 bg-white-smoke" style={{width: "280px"}}>
      <ul className="ist-unstyled ps-0">
        <div className="mb-1">
            <button className="btn btn-toggle align-items-center rounded collapsed" data-bs-toggle="collapse" data-bs-target="#home-collapse" aria-expanded="true">
                Menu
            </button>
            <div className="collapse show" id="home-collapse">
                <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">

                {isAuth === true ? (
                  <Fragment>
                    {' '}
                    <li>
                        {user.is_staff === true ? (
                            <Link to='/dashboard' className="link-dark rounded">Clients</Link>
                        ) : (

                            <Link to={'/fin_instruments/'+user.id} className="link-dark rounded">Financial Instruments</Link>
                            )
                        }

                    </li>
                    <li>
                      <Link to='/logout' className="link-dark rounded">Logout</Link>
                    </li>
                  </Fragment>
                ) : (
                  <Fragment>
                    {' '}
                    <li>
                      <Link to='/login' className="link-dark rounded">Login</Link>
                    </li>
                  </Fragment>
                )}

                </ul>
            </div>
        </div>
      </ul>
    </div>
    <div class="a-example-divider"></div>
  </Fragment>
  );
};

export default Navbar;