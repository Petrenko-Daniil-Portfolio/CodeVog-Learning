import React, { useState, useEffect, Fragment } from 'react';
import * as Constants from '../dependencies';

const Dashboard = () => {
  const [user, setUser] = useState('');

  const [leadList, setLeadList] = useState([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('token') === null) {
      window.location.replace(Constants.SITE_URL+'login');
    } else {
    //Get fin_advisor
      fetch(Constants.SERVER_API+'lead/auth/user/', {
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

    //Get leads of fin_advisor
      fetch(Constants.SERVER_API+'lead',{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
            setLeadList(data)
            setLoading(false);
        })

    }
  }, []);

  return (

        <div>
          {loading === false && (
            <Fragment>
              <h1>Dashboard</h1>
              <h2>Hello {user.email}!</h2>
              <table className="table table-striped">
                <thead>
                    <tr>
                        <th scope="col">Username</th>
                        <th scope="col">Email</th>
                        <th scope="col">Fullname</th>
                    </tr>
                </thead>

                <tbody>
                    {leadList.map(lead => {
                            if (lead.fin_advisor === user.pk && lead.id !== lead.fin_advisor){
                                return (
                                    <tr key={lead.id}>
                                        <td> <a href={"/fin_instruments/"+lead.id}> {lead.username} </a> </td>
                                        <td>{lead.email}</td>
                                        <td>{lead.first_name} {lead.last_name}</td>
                                    </tr>
                                );
                            }
                    })}

                </tbody>
              </table>
            </Fragment>
          )}
        </div>
  );
};

export default Dashboard;