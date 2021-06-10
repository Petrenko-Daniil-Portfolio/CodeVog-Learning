import React from 'react';
//router
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
// pages
import Login from './LoginPage'
//Navbar

const ReactRouter = () => {
    return (
        <Router>
            <Switch>

                <Route path='/'>
                    <Login/>
                </Route>



            </Switch>
        </Router>
    );
};

export default ReactRouter;