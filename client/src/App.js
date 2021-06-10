import React, { Component } from "react";
import { render } from "react-dom";

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Login from './views/auth/LoginPage';
import Logout from './views/auth/LogoutPage';
import Dashboard from './views/app/Dashboard';

function App () {
    return (
        <div>
            <Router>
                <Navbar / >

                <Switch>
                    <Route path='/login' component={Login} exact />
                    <Route path='/logout' component={Logout} exact />
                    <Route path='/dashboard' component={Dashboard} exact />
                </Switch>

            </Router>
        </div>
    );
}

export default App;