import React, { Component } from "react";
import { render } from "react-dom";
import DjangoCSRFToken from 'django-react-csrftoken'

class Login extends Component{
    render(){
        return(
            <form action="" method='POST'>
            <DjangoCSRFToken/>

                <input type="text" name="email" placeholder="Email"/>
                <br/><br/>

                <input type="password" name="password" placeholder="Password"/>
                <br/><br/><br/>

                <input type='submit' value='Log In'/>
            </form>

        );
    }
}


export default Login;