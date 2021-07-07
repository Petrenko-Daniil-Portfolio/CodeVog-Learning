import React, { useState, useEffect, useRef, Fragment } from 'react';
import AddInstrument from './AddInstrument';
import * as Constants from '../dependencies';

import BasicLineChart from '../../components/charts/BasicLineChart';

const FinInstruments = (props) => {

    const UpdateChartLinesMethod_ref = useRef(null)

    const [user, setUser] = useState('');
    const [lead, setLead] = useState('');

    const [portfolio, setPortfolio] = useState([]);
    const [finInstruments, setFinInstruments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [avatar, setAvatar] = useState('')

    useEffect(  () => {
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
              fetch(Constants.SERVER_API+'lead/'+props.match.params.id, {
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
                        window.location.replace(Constants.SITE_URL+'login');

                    }

                    //fetch for client`s fin instruments will go here
                    fetch(Constants.SERVER_API+'lead/'+data.id+'/portfolio', {
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

                          await fetch(Constants.SERVER_API+'fin_instrument/'+portfolioList[row].instrument, {
                            method: 'GET',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Token ${localStorage.getItem('token')}`
                            }
                          })
                          .then(res => res.json())
                          .then(instrument => {

                            instrument['quantity'] = portfolioList[row].quantity
                            instruments.push(instrument)

                          })

                        }
                        setFinInstruments(instruments)
                    })


                })
            });

        }
    }, []);


    const sendEmail = (old_quantity, instrument, status) => {
        // send fetch to send mail
        console.log("INSTRUMENT")
        console.log(instrument)
        let req_body = {
            'status': status,
            'instrument': instrument,
            'old_quantity': old_quantity,
            'lead': lead
        }

        fetch(Constants.SERVER_API + 'send_email/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req_body)
        })
        .then(res => res.json())
        .then(data => {
            console.log(data)
        })
    }

    const updateInstrument = (instrument_to_update, status=null, portfolio_to_update=null) => {
        if (status === 'create' && portfolio_to_update!==null) {
            console.log('create')
            let new_finInstruments = [...finInstruments]
            instrument_to_update['quantity'] = portfolio_to_update['quantity']
            new_finInstruments.push(instrument_to_update)

            let new_portfolio = [...portfolio]
            new_portfolio.push(portfolio_to_update)


            setFinInstruments(new_finInstruments)
            setPortfolio(new_portfolio)

            let old_quantity=0
            sendEmail(old_quantity, instrument_to_update, status)

        }else if ( status==='update' ){

            let new_finInstruments = [...finInstruments]

            for (var i in new_finInstruments){

                if (instrument_to_update.instrument === new_finInstruments[i].id && new_finInstruments[i].quantity != instrument_to_update.quantity){
                    let old_quantity = new_finInstruments[i].quantity
                    new_finInstruments[i].quantity = instrument_to_update.quantity

                    sendEmail(old_quantity, new_finInstruments[i], status)

                }
            }

        setFinInstruments(new_finInstruments)

        }else if (status==='add' && portfolio_to_update!==null){
        //instrument already exists we need to add it
            let new_portfolio = [...portfolio]
            new_portfolio.push(portfolio_to_update)

            let new_finInstruments = [...finInstruments]
            instrument_to_update['quantity'] = portfolio_to_update['quantity']
            new_finInstruments.push(instrument_to_update)

            setFinInstruments(new_finInstruments)
            setPortfolio(new_portfolio)

            let old_quantity=0
            sendEmail(old_quantity, instrument_to_update, status)

        }else{
            alert('You made a mistake while passing parameters to update the Instrument')
        }

    }

    const deleteInstrument = (fin_instrument_id) => {
        //we are not delete the instrument but portfolio row with such instrument

        let portfolio_to_delete = null
        let new_portfolio = []
        let new_finInstruments = []

        // loop over portfolio to add all portfolio rows to new portfolio except deleted one
        for (let index in portfolio){
            if (portfolio[index].instrument === fin_instrument_id ){
                portfolio_to_delete = portfolio[index]
            }else{
                new_portfolio.push(portfolio[index])
            }
        }

        // loop over instruments to add all except the deleted one
        let instrument = null
        for (let i in finInstruments){
            if (finInstruments[i].id != fin_instrument_id){
                new_finInstruments.push(finInstruments[i])
            }else{

                instrument = finInstruments[i]
            }
        }

        let portfolio_req_url = Constants.SERVER_API+'portfolio/'+portfolio_to_delete.id
        fetch(portfolio_req_url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        .then( () => {
            setPortfolio(new_portfolio)
            setFinInstruments(new_finInstruments)

            if (instrument!=null){
                let old_quantity = portfolio_to_delete['quantity']
                instrument['quantity'] = 0
                let status = 'delete'

                sendEmail(old_quantity, instrument, status)

            }else{
                console.log("!ERROR!")
            }
        })


    }

    return (
        <div>
            <div className='d-flex'>
            <img style={{width: '200px', height: '200px'}} src={lead.image} className="rounded float-left" />
            </div>


        {user.is_staff === true &&
          <div>
            <h2> Add Instrument</h2>
            <br />
            <AddInstrument UpdateChartLinesMethod_ref={UpdateChartLinesMethod_ref} leadId={lead.id} updInstrument={updateInstrument}  fin_advisor={user} portfolio={portfolio}  />
          </div>
        }
        <br />

        <h2> FinInstruments of <span style={{color: "#107896"}}><b> {lead.username} </b></span></h2>
        <br />
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
                    return(
                        <tr key= {finInstrument.id} >
                            <td> {finInstrument.name} </td>
                            <td> {finInstrument.symbol} </td>
                            <td> {finInstrument.quantity} </td>
                            <td> {finInstrument.type} </td>
                            <td> {finInstrument.region} </td>

                            {user.is_staff === true &&
                                <td>
                                    <button onClick={ () => deleteInstrument(finInstrument.id)} className="btn btn-outline-danger">Delete</button>
                                </td>
                            }

                        </tr>
                    );
                })}
            </tbody>
        </table>
        <br/>


        {finInstruments && finInstruments.length &&
            <BasicLineChart UpdateChartLinesMethod_ref={UpdateChartLinesMethod_ref}  finInstruments={finInstruments} lead={lead}  />
        }
        </div>
    );

};

export default FinInstruments;