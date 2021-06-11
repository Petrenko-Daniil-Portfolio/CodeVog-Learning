import React, { Component } from "react";
import { render } from "react-dom";

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Login from './views/auth/LoginPage';
import Logout from './views/auth/LogoutPage';
import Dashboard from './views/app/Dashboard';
import FinInstruments from './views/app/FinInstruments';

function App () {
    return (
        <div>
            <Router>
                <Navbar / >

                <Switch>
                    <Route exact path='/login' component={Login} />
                    <Route exact path='/logout' component={Logout} />
                    <Route exact path='/dashboard' component={Dashboard} />

                    <Route exact path='/fin_instruments/:id' component={FinInstruments} />
                </Switch>

            </Router>
        </div>
    );
}

export default App;