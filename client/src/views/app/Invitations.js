import React, {useState, useEffect, Fragment} from 'react';
import DjangoCSRFToken from 'django-react-csrftoken'
import * as Constants from '../dependencies.js';

const Invitations = (props) => {

    const[email, setEmail] = useState('')

    const [message, setMessage] = useState('Entre email and press "Send" button to invite lead')
    const [messageType, setMessageType] = useState('info')

    const [invitations, setInvitations] = useState([{'email': 'test@gmail.com', 'status': 'Invitation expired'}]) // {'email': 'test@gmail.com', 'status': 'sent'}

    const [finAdvisor, setFinAdvisor] = useState('')

    useEffect (() => {

        // check for token
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
            .then(user => {
                //Get lead
                fetch(Constants.SERVER_API+'lead/'+props.match.params.id, {
                    method: 'GET',
                    headers: {
                    'Content-Type': 'application/json',
                     Authorization: `Token ${localStorage.getItem('token')}`
                    }
                })
                .then(res => res.json())
                .then(fin_advisor_data => {
                    console.log(fin_advisor_data)
                    setFinAdvisor(fin_advisor_data)

                    //If user that entered page is not owner or staff -> redirect
                    if (user.id != fin_advisor_data.id){ // && user.is_staff == false
                        window.location.replace(Constants.SITE_URL+'login');
                    }
                })
            })
          })
        }
        //get all invitations
    }, [])

    const sendInvitation = (receiver_email) => {
       const emailRegex = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/;
       if (emailRegex.test(receiver_email)) {
            // create invitation
            let req_url = Constants.SERVER_API + 'send_invitation/'
            let req_body = {
                'receiver_email': receiver_email,
                'fin_advisor_id': finAdvisor['id'],
            }
            fetch(req_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req_body)
            })
            .then(res => res.json())
            .then(response => {
                console.log("-_-")
                console.log(response)

                let description = response['description']
                if (description == "This user is already yours"){
                    setMessage(description)
                    setMessageType('warning')
                } else if (description == "This user already has invitation"){
                    setMessage(description)
                    setMessageType('warning')
                }else{
                    setMessage('Email was send successfully')
                    setMessageType('success')
                }

                //display success
                //setMessage('Email was send successfully')
                //setMessageType('success')
            })



       }else{
            //display error
            setMessage('Wrong email. Please be more attentive.')
            setMessageType('danger')
       }
    }

    return(
        <Fragment>
            <h1>Invitations Page</h1>

            <h2 className="text-start">Send Invitation:</h2>
            <form className="text-start"> <DjangoCSRFToken/>
                <input type='email' placeholder="email@address.com" name='email' value={email} onChange={e => setEmail(e.target.value)} />

                <button onClick={ () => sendInvitation(email)} className="btn btn-primary ms-2" type="button">Send Invitation</button>

            </form>
            <br />

            <div className={'alert alert-'+messageType}>{message}.</div>
            {/*<tr className={'alert alert-'+messageType}><td colSpan='4'> {message} </td></tr>*/}

            { invitations.length >  0 &&
              <Fragment>
                <h2 className="text-start">Invitations:</h2>
                <table className="table table-striped">

                    <thead>
                        <tr>
                             <th scope="col">Email</th>
                             <th scope="col">Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {invitations.map( (invitation, index) => {
                            return(
                                <tr key={index} >
                                    <td> {invitation['email']} </td>
                                    <td>
                                        {invitation['status'] == "Invitation expired"? (
                                          <Fragment>
                                            <span>{invitation['status']}</span>
                                            <button type="button" className="btn btn-outline-dark ms-5">Resend</button>
                                          </Fragment>
                                            ) : (
                                             <span>{invitation['status']}</span>
                                            )

                                        }
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>

                </table>
              </Fragment>
            }

        </Fragment>
    )
}

export default Invitations;