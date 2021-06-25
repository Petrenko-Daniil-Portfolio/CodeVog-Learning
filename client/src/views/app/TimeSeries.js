import React, { useState, useEffect, Fragment } from 'react';
import * as Constants from '../dependencies';

const TimeSeries = (props) =>{
    const [lead, setLead] = useState('');
    const [finAdvisor, setFinAdvisor] = useState('');

    const [portfolio, setPortfolio] = useState([]);
    const [finInstruments, setFinInstruments] = useState([]);

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect( () =>{
        if (localStorage.getItem('token') === null) {
          window.location.replace(Constants.SITE_URL+'login');
        } else {
            fetch(Constants.SERVER_API+'lead/auth/user/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${localStorage.getItem('token')}`
                }
            })
            .then( res => res.json() )
            .then( auth_user => {
                if (auth_user.pk != props.match.params.id){
                    window.location.replace(Constants.SITE_URL+'time_series/'+auth_user.pk)
                }

                fetch(Constants.SERVER_API+'lead/'+auth_user.pk, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then( res => res.json() )
                .then( lead => {

                    setLead(lead)

                    //get lead fin_advisor
                    fetch(Constants.SERVER_API+'lead/'+lead.fin_advisor, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then( res => res.json() )
                    .then( fin_advisor => {
                        setFinAdvisor(fin_advisor)



                        //get lead portfolio
                        fetch(Constants.SERVER_API+'lead/'+lead.id+'/portfolio', {
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
                                await fetch(Constants.SERVER_API+'fin_instrument/'+portfolio[index].instrument,{
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
                                let instrument =  new_finInstruments[i]['id']
                                let req_url = Constants.SERVER_API+'time_series_data/?instrument='+ instrument
                                console.log(new_finInstruments[i]['symbol'])
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
                                    //sort time series so the latest was the first one
                                    time_series.sort((a, b) => new Date(b.date) - new Date(a.date))
                                    console.log(time_series)

                                    let col_counter = i + 1
                                    let row_counter = 0

                                    for( let key in time_series ){
                                        let td = document.getElementById(""+row_counter+""+col_counter)
                                        console.log(time_series[key])
                                        console.log("++++++++++")
                                        if (col_counter===1) {

                                            let date_td = document.getElementById(""+row_counter+"0")
                                            date_td.innerHTML = "<b>"+time_series[key]['date']+"</b>"
                                            td.innerHTML = time_series[key]['close_price']
                                        }else{
                                            td.innerHTML = time_series[key]['close_price']
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

                    {error ==''&& loading == true &&

                        <tr className='alert alert-info'><td colSpan={finInstruments.length+1}> Loading </td></tr>

                    }

                    {error !='' &&
                        <tr className='alert alert-danger'><td colSpan={finInstruments.length+1}> {error} </td></tr>
                    }
                </thead>


                <tbody id='tbody' hidden={loading}>

                    {loading &&

                        <tr className='alert alert-info'><td colSpan={finInstruments.length+1}> Loading </td></tr>

                    }

                </tbody>

            </table>

        </Fragment>
    )
}

export default TimeSeries