import React, { useState, useEffect, useRef, Fragment } from 'react';
import * as Constants from '../dependencies';

import CheckAccess from '../../components/utils/check_access';

const PortfolioValue = (props) =>{

    const [user, setUser] = useState(''); // user is the one who entered page
    const [lead, setLead] = useState(''); // lead is the one whose id was passed in url

    useEffect( () => {
        if (localStorage.getItem('token') === null) {
          window.location.replace(Constants.SITE_URL+'login');
        } else {
          //Get user that entered page
          fetch(Constants.SERVER_API+'lead/auth/user/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${localStorage.getItem('token')}`
            }
          })
            .then(res => res.json())
            .then(user_data => {
              setUser(user_data)

              //get lead
              fetch(Constants.SERVER_API+'lead/'+props.match.params.id, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Token ${localStorage.getItem('token')}`
                }
              })
                .then(res => res.json())
                .then(lead_data => {
                    setLead(lead_data);

                    //If user that entered page is not owner or staff -> redirect
                    if (user.id != lead_data.id && user.is_staff == false){
                        window.location.replace(Constants.SITE_URL+'Logout');
                    }

                    //send request to get data from server
                    fetch(Constants.SERVER_API+"portfolio_value", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({'lead': lead_data})
                    })
                    .then(res => res.json())
                    .then(data => {
                        console.log(data)
                    })
                })
            })
        }



    }, [])

    return(

        <div>


            <h2>Portfolio Value Page</h2>
        </div>

    )
}


export default PortfolioValue