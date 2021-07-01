import React, { Component } from "react";
import { render } from "react-dom";

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Login from './views/auth/LoginPage';
import Logout from './views/auth/LogoutPage';
import Dashboard from './views/app/Dashboard';
import FinInstruments from './views/app/FinInstruments';
import TimeSeries from './views/app/TimeSeries.js';
import NotFound from './views/app/NotFound';
import PortfolioValue from './views/app/PortfolioValue'

function App () {
    return (
        <div data-testid='app-wrapper' className="container-fluid">
            <div className="row min-vh-100 flex-column flex-md-row">

                <Router>

                    <Navbar / >
                        <main className='col px-0 flex-grow-1 overflow-scroll' >
                            <div className='container py-3'>

                                <Switch>
                                    <Route exact path='/login' component={Login} />
                                    <Route exact path='/logout' component={Logout} />
                                    <Route exact path='/dashboard' component={Dashboard} />

                                    <Route exact path='/fin_instruments/:id' component={FinInstruments} />
                                    <Route exact path='/time_series/:id' component={TimeSeries} />
                                    <Route exact path='/portfolio_value/:id' component={PortfolioValue} />

                                    <Route path="*" component={NotFound} />
                                </Switch>

                            </div>
                        </main>

                </Router>

            </div>
        </div>
    );
}

export default App;