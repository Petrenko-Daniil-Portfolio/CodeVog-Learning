import React, { useState, useEffect, Fragment } from 'react';

const TimeSeries = (props) =>{
    const [lead, setLead] = useState('');
    const [finAdvisor, setFinAdvisor] = useState('');

    const [portfolio, setPortfolio] = useState([]);
    const [finInstruments, setFinInstruments] = useState([]);

    useEffect( () =>{
        if (localStorage.getItem('token') === null) {
          window.location.replace('http://localhost:3000/login');
        } else {
            fetch('http://127.0.0.1:8000/api/lead/auth/user/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${localStorage.getItem('token')}`
                }
            })
            .then( res => res.json() )
            .then( auth_user => {
                if (auth_user.pk != props.match.params.id){
                    window.location.replace('http://localhost:3000/time_series/'+auth_user.pk)
                }

                fetch('http://127.0.0.1:8000/api/lead/'+auth_user.pk, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then( res => res.json() )
                .then( lead => {

                    setLead(lead)

                    //get lead fin_advisor
                    fetch('http://127.0.0.1:8000/api/lead/'+lead.fin_advisor, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then( res => res.json() )
                    .then( fin_advisor => {
                        setFinAdvisor(fin_advisor)
                    })


                    //get lead portfolio
                    fetch('http://127.0.0.1:8000/api/lead/'+lead.id+'/portfolio', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${localStorage.getItem('token')}`
                      }
                    })
                    .then( res => res.json() )
                    .then ( async (portfolio) => {

                        let new_finInstruments = []
                        for (let index in portfolio){
                            await fetch('http://127.0.0.1:8000/api/fin_instrument/'+portfolio[index].instrument,{
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                            .then( res => res.json() )
                            .then( instrument => {
                                new_finInstruments.push(instrument)
                            })
                        }

                        setFinInstruments(new_finInstruments)

                        let tbody = document.getElementById('tbody')

                        console.log(finInstruments)
                        for (let row=0; row<31; row++){

                            let tr = document.createElement('tr')

                            let cols = new_finInstruments.length + 1
                            for(let col=0; col<cols; col++){
                                let td = document.createElement('td')
                                td.id = ''+row+""+col
                                td.innerHTML = td.id
                                tr.appendChild(td)
                            }
                            tbody.appendChild(tr)

                        }

                        //for each fin inst make query and then insert in propper table

                        for (let i in finInstruments){

                            let req_url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol='+finInstruments[i].symbol+'&apikey='+finAdvisor.apikey.key

                            await fetch(req_url, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                            .then( res => res.json() )
                            .then( time_series => {

                                console.log(time_series[1])

                            })

                        }

                    })

                })

            })


        }
    }, [])

    return(
        <Fragment>
            <h2> TimeSeries of <span style={{color: "#107896"}}><b> {lead.username} </b></span></h2>

            <table>

                <thead>
                    <tr>
                        <th>Date</th>
                        {finInstruments.map( (instrument, index) => {
                            return(
                                <th key={index} scope='col'>{instrument.symbol}</th>
                            )
                        })}
                    </tr>
                </thead>

                <tbody id='tbody'>

                </tbody>

            </table>


        </Fragment>
    )
}

export default TimeSeries