import React, { useState, useEffect, Fragment } from 'react';
import * as Constants from '../dependencies';
import DjangoCSRFToken from 'django-react-csrftoken'

const Dashboard = () => {
  const [user, setUser] = useState('');

  const [leadList, setLeadList] = useState([])
  const [loading, setLoading] = useState(true);

  const [symbol, setSymbol] = useState('')
  const [finInstruments, setFinInstruments] = useState([])

  const [message, setMessage] = useState('Press "Find Time Series" to get all of them, enter "Symbol" to  find specific one')
  const [messageType, setMessageType] = useState('info')
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

  const findTimeSeries = () => {

    fetch(Constants.SERVER_API + 'fin_instrument/?symbol='+symbol, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(res => res.json())
    .then(instruments => {
        for (let index in instruments){
            instruments[index].status = 'None'
        }
        setFinInstruments(instruments)

        if (instruments.length === 0){
            setMessage('There is no instrument with symbol "'+symbol+'" please be more accurate')
            setMessageType('warning')
        }
        else{
            setMessage('Instruments were successfully displayed')
            setMessageType('success')
        }
    })

    setSymbol('')
  }

  const updateAllTimeSeries = () => {
    fetch(Constants.SERVER_API + 'time_series/', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        if (data.success == true){
            setMessage('All Time Series were successfully updated')
            setMessageType('success')

            if (finInstruments.length > 0){
                let newFinInstruments = [...finInstruments]

                for (let i in newFinInstruments){
                    newFinInstruments[i].status = 'updated'
                }

                setFinInstruments(newFinInstruments)
                console.log(finInstruments)
            }

        }else{
            setMessage('Error occurred while updating All Time Series')
            setMessageType('danger')
        }
    })
  }

  const updateSingleTimeSeries = (instrument) => {
        let data = {
            'instrument_id': instrument.id,
            'instrument_symbol': instrument.symbol,
            'instrument_apikey': instrument.apikey
        }

        fetch(Constants.SERVER_API + 'time_series/', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            console.log(data)
        })
  }

  const updateAllTimeSeriesOfInstrument = (instrument) => {
        let data = {
            'instrument_symbol': instrument.symbol,
            'instrument_apikey': instrument.apikey
        }

        fetch(Constants.SERVER_API + 'time_series/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            console.log(data)
        })
  }

  return (

        <div>
          {loading === false && (
            <Fragment>
              <h1>Dashboard</h1>
              <h2>Hello {user.email}!</h2>
              <h2 className="text-start">Users:</h2>
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

                <br/>

                <br/>


              <h2 className="text-start">Financial Instruments:</h2>

              <form className="text-start"> <DjangoCSRFToken/>
                <input placeholder="Symbol" name='symbol' value={symbol} onChange={e => setSymbol(e.target.value)} />

                <button onClick={ () => findTimeSeries()} className="btn btn-primary ms-2" type="button">Find Time Series</button>
                <button onClick={ () => updateAllTimeSeries()} className="btn btn-secondary ms-2" type="button">Update All Time Series</button>

                </form>
                <br/>

              <table className="table table-striped">
                  <thead>
                        <tr>
                            <th scope="col">Symbol</th>
                            <th scope="col">Name</th>
                            <th scope="col">Actions</th>
                            <th scope="col">Status</th>
                        </tr>
                  </thead>

                  <tbody>

                        <tr className={'alert alert-'+messageType}><td colSpan='4'> {message} </td></tr>


                        {finInstruments.map(instrument => {
                            return(
                                <tr key={instrument.id}>
                                    <td>{instrument.symbol}</td>
                                    <td>{instrument.name}</td>
                                    <td>
                                        <button onClick={ () => updateSingleTimeSeries(instrument)} type="button" className="btn btn-outline-primary ms-2">Update Last Day</button>
                                        <button onClick={ () => updateAllTimeSeriesOfInstrument(instrument)} type="button" className="btn btn-secondary ms-2">Update All</button>
                                    </td>
                                    <td>{instrument.status}</td>
                                </tr>
                            )

                        })}

                  </tbody>

              </table>

            </Fragment>
          )}
        </div>
  );
};

export default Dashboard;