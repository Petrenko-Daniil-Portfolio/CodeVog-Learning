import React, { useState, useEffect, Fragment } from 'react';

const TimeSeries = (props) =>{
    const [lead, setLead] = useState('');
    const [finAdvisor, setFinAdvisor] = useState('');

    const [portfolio, setPortfolio] = useState([]);
    const [finInstruments, setFinInstruments] = useState([]);

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

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

                            setPortfolio(portfolio)
                            setFinInstruments(new_finInstruments)


                            let tbody = document.getElementById('tbody')


                            for (let row=0; row<31; row++){

                                let tr = document.createElement('tr')

                                let cols = new_finInstruments.length + 1
                                for(let col=0; col<cols; col++){
                                    let td = document.createElement('td')
                                    td.id = ''+row+""+col

                                    tr.appendChild(td)
                                }
                                tbody.appendChild(tr)

                            }

                            //for each fin inst make query and then insert in propper table

                            for (let i=0; i<new_finInstruments.length; i++){

                                let req_url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol='+new_finInstruments[i].symbol+'&apikey='+fin_advisor.apikey.key

                                await fetch(req_url, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                })
                                .then( res => res.json() )
                                .then( time_series => {
                                    if(time_series['Note'] && error===''){
                                        setError(time_series['Note'])
                                    }

                                    let col_counter = i + 1
                                    let row_counter = 0
                                    for( let key in time_series['Time Series (Daily)'] ){
                                        let td = document.getElementById(""+row_counter+""+col_counter)
                                        if (col_counter===1) {

                                            let date_td = document.getElementById(""+row_counter+"0")
                                            date_td.innerHTML = "<b>"+key+"</b>"
                                            td.innerHTML = time_series['Time Series (Daily)'][key]['4. close']
                                        }else{
                                            td.innerHTML = time_series['Time Series (Daily)'][key]['4. close']
                                        }

                                        row_counter++

                                        if (row_counter >= 31){
                                            break;
                                        }


                                    }

                                })

                            }
                            setLoading(false)
                        })
                    })

                })

            })

        }
    }, [])


    function clear_tbl(){
        let tbl = document.getElementById('tbl_time_series')
        tbl.innerHTML = error
    }

    return(
        <Fragment>
            <h2> TimeSeries of <span style={{color: "#107896"}}><b> {lead.username} </b></span></h2>

            <table className="table table-striped" id='tbl_time_series'>

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


                <tbody id='tbody' hidden={loading}>
                    {error !='' &&
                        <tr className='alert alert-danger'><td colspan={finInstruments.length+1}> {error} </td></tr>
                    }

                </tbody>

            </table>

        </Fragment>
    )
}

export default TimeSeries