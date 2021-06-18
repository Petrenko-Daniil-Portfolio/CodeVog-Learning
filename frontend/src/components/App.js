import React, { Component } from "react";
import { render } from "react-dom";

import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import Navbar from './Navbar';
import Login from './LoginPage';
import Logout from './LogoutPage';
import Dashboard from './Dashboard';

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
