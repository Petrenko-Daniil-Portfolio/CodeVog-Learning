import React, { Component } from "react";
import { render } from "react-dom";
import DjangoCSRFToken from 'django-react-csrftoken'

class FinAdvisorPage extends Component{
    render( ){
        return(
            <div>fiadvisorpage</div>
        );
    }
}

export default FinAdvisorPage;

const container = document.getElementById("fin_advisor");
render(<FinAdvisorPage />, container);