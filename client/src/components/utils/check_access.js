import React, { useState, useEffect, useRef, Fragment } from 'react';
import * as Constants from '../../views/dependencies';

const CheckAccess = ( {user, setUser, lead, setLead, url_id} ) => {

    useEffect ( () => {
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
            .then(data => {



              fetch(Constants.SERVER_API+'lead/'+data.pk, {
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
            })
            .then( () => {
              //Get lead
              fetch(Constants.SERVER_API+'lead/'+url_id, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Token ${localStorage.getItem('token')}`
                }
              })
                .then(res => res.json())
                .then(data => {


                    //If user that entered page is not owner or staff -> redirect
                    if (user.id != lead.id && user.is_staff == false){
                        window.location.replace(Constants.SITE_URL+'Logout');
                    }

                })
            });

        }
    }, [])

    return (<div></div>)
};

export default CheckAccess