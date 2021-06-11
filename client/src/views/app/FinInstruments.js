import React, { useState, useEffect, Fragment } from 'react';

const FinInstruments = (props) => {
    const [user, setUser] = useState('');
    const [lead, setLead] = useState('')

    const [finInstruments, setFinInstrumentsList] = useState([])

    const [loading, setLoading] = useState(true);

    useEffect( () => {
        if (localStorage.getItem('token') === null) {
          window.location.replace('http://localhost:3000/login');
        } else {
        //Get user that entered page


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
            });

          //fetch for client`s fin instruments will go here
          //
          const fin_instrumets = [
            {
                symbol: "TSCDY",
                quantity: 10
            },

            {
                symbol: "AAPL",
                quantity: 50
            },

            {
                symbol: "AMZN",
                quantity: 120
            },

          ];

          setFinInstrumentsList(fin_instrumets)
        }
    }, []);


    return (
    <div>
        FinInstruments of {lead.id}
    </div>
    );

};

export default FinInstruments;