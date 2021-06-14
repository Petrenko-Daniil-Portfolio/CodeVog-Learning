import React, { useState, useEffect, Fragment } from 'react';

const FinInstruments = (props) => {
    const [user, setUser] = useState('');
    const [lead, setLead] = useState('');

    const [finInstruments, setFinInstruments] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect( () => {
        if (localStorage.getItem('token') === null) {
          window.location.replace('http://localhost:3000/login');
        } else {

        //Get user that entered page
          fetch('http://127.0.0.1:8000/api/lead/auth/user/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${localStorage.getItem('token')}`
            }
          })
            .then(res => res.json())
            .then(data => {
              fetch('http://127.0.0.1:8000/api/lead/'+data.pk, {
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
            });

        //Get lead
          fetch('http://127.0.0.1:8000/api/lead/'+props.match.params.id, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${localStorage.getItem('token')}`
            }
          })
            .then(res => res.json())
            .then(data => {
                setLead(data)

                //If user that entered page is not owner or staff -> redirect
                  if (user.id != lead.id && user.is_staff == false){
                      window.location.replace('http://localhost:3000/login');

                  }
                  //fetch for client`s fin instruments will go here
                  //
                  const fin_instrumets = [
                    {
                        id: 1,
                        symbol: "TSCDY",
                        quantity: 10
                    },

                    {
                        id: 2,
                        symbol: "AAPL",
                        quantity: 50
                    },

                    {
                        id: 3,
                        symbol: "AMZN",
                        quantity: 120
                    },

                  ];

                  setFinInstruments(fin_instrumets)
                    });

        }
    }, []);


    return (
        <div>

        <h2> FinInstruments of <span style={{color: "#107896"}}><b> {lead.username} </b></span></h2>
        <table className="table table-striped">
            <thead>
                <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Symbol</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Type</th>
                    <th scope="col">Region</th>
                    {user.is_staff === true &&
                        <th>Actions</th>
                    }
                </tr>
            </thead>

            <tbody>
                 {finInstruments.map(finInstrument => {
                    return(
                        <tr key= {finInstrument.id} >
                            <td> name </td>
                            <td> {finInstrument.symbol} </td>
                            <td> {finInstrument.quantity} </td>
                            <td> type </td>
                            <td> region </td>

                            {user.is_staff === true &&
                                <td>
                                    <a>Update/</a>
                                    <a>Delete</a>
                                </td>
                            }



                        </tr>
                    );
                })}
            </tbody>
        </table>

        </div>
    );

};

export default FinInstruments;