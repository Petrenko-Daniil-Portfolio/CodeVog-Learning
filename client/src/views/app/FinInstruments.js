import React, { useState, useEffect, Fragment } from 'react';

const FinInstruments = (props) => {
    const [user, setUser] = useState('');
    const [lead, setLead] = useState('');

    const [portfolio, setPortfolio] = useState([]);
    const [finInstruments, setFinInstruments] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(  () => {
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
            })
            .then( () => {
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
                    fetch('http://127.0.0.1:8000/api/lead/'+data.id+'/portfolio', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${localStorage.getItem('token')}`
                      }
                    })
                    .then(res => res.json())
                    .then( async (portfolioList) => {

                        setPortfolio(portfolioList)

                        var instruments = []

                        for (var row=0; row<portfolioList.length; row++){

                          await fetch('http://127.0.0.1:8000/api/lead/fin_instrument/'+portfolioList[row].instrument, {
                            method: 'GET',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Token ${localStorage.getItem('token')}`
                            }
                          })
                          .then(res => res.json())
                          .then(instrument => {

                            instruments.push(instrument)

                          })

                        }


                        console.log("+")
                        console.log(instruments)
                        console.log(portfolioList)
                        for (var i=0; i<finInstruments.length; i++){
                            finInstruments[i]['quantity'] = portfolioList[i].quantity
                        }

                        setFinInstruments(instruments)
                    })


                })
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

                 {finInstruments.map( finInstrument => {
                    {console.log("-")}
                    {console.log(finInstrument)}
                    return(
                        <tr key= {finInstrument.id} >
                            <td> {finInstrument.name} </td>
                            <td> {finInstrument.symbol} </td>
                            <td> {finInstrument.quantity} </td>
                            <td> {finInstrument.type} </td>
                            <td> {finInstrument.region} </td>

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