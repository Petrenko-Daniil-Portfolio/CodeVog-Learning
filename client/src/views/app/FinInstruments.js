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

    const updateInstrument = (instrument_to_update, status=null, portfolio_to_update=null) => {
        if (status === 'create' && portfolio_to_update!==null) {

            let new_finInstruments = [...finInstruments]
            instrument_to_update['quantity'] = portfolio_to_update['quantity']
            new_finInstruments.push(instrument_to_update)

            let new_portfolio = [...portfolio]
            new_portfolio.push(portfolio_to_update)


            setFinInstruments(new_finInstruments)
            setPortfolio(new_portfolio)

        }else if ( status==='update' ){

            let new_finInstruments = [...finInstruments]

            for (var i in new_finInstruments){

                if (instrument_to_update.instrument === new_finInstruments[i].id){
                    new_finInstruments[i].quantity = instrument_to_update.quantity
                }

            }
        setFinInstruments(new_finInstruments)

        }else if ( status==='add' && portfolio_to_update!==null){
        //instrument already exists we need to add it
            let new_portfolio = [...portfolio]
            new_portfolio.push(portfolio_to_update)

            let new_finInstruments = [...finInstruments]
            instrument_to_update['quantity'] = portfolio_to_update['quantity']
            new_finInstruments.push(instrument_to_update)

            setFinInstruments(new_finInstruments)
            setPortfolio(new_portfolio)
            console.log(new_portfolio)

        }else{
            alert('You made a mistake while passing parameters to update the Instrument')
        }

    }

    const deleteInstrument = (fin_instrument_id) => {
        //we are not delete the instrument but portfolio row with such instrument
        console.log("+--+")
        console.log(fin_instrument_id)

        let portfolio_to_delete = null
        let new_portfolio = []
        let new_finInstruments = []

        for (let index in portfolio){
            if (portfolio[index].instrument === fin_instrument_id ){
                portfolio_to_delete = portfolio[index].id
            }else{
                new_portfolio.push(portfolio[index])
            }
        }

        for (let i in finInstruments){
            if (finInstruments[i].id != fin_instrument_id){
                new_finInstruments.push(finInstruments[i])
            }
        }

        let portfolio_req_url = Constants.SERVER_API+'portfolio/'+portfolio_to_delete
        fetch(portfolio_req_url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        .then( () => {

            setPortfolio(new_portfolio)
            setFinInstruments(new_finInstruments)
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