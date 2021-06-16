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


        <aside className="col-12 col-md-3 col-xl-2 p-0 bg-dark flex-shrink-1">
          <nav className='navbar navbar-expand-md navbar-dark bd-dark flex-md-column flex-row align-items center py-2 text-center sticky-top' id="sidebar">



                {isAuth === true ? (
                    <Fragment>
                    {' '}

                        {user.is_staff === true ? (
                            <li>
                                <Link to='/dashboard' className="nav-link">Clients</Link>
                            </li>
                        ) : (
                            <Fragment>
                                <li>
                                    <Link to={'/time_series/'+user.id} className="nav-link">Time Series</Link>
                                </li>
                                <li>
                                    <Link to={'/fin_instruments/'+user.id} className="nav-link">Financial Instruments</Link>
                                </li>
                            </Fragment>
                            )
                        }


                    <li>
                      <Link to='/logout' className="nav-link">Logout</Link>
                    </li>
                  </Fragment>
                ) : (
                  <Fragment>
                    {' '}
                    <li>
                      <Link to='/login' className="nav-link">Login</Link>
                    </li>
                  </Fragment>
                )}


          </nav>
        </aside>



  </Fragment>
  );
};

export default Navbar;