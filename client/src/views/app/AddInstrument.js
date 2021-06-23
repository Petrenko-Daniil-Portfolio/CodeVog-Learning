import React, { Component, useState, useEffect } from "react";
import { render } from "react-dom";
import DjangoCSRFToken from 'django-react-csrftoken'
import * as Constants from '../dependencies';

const AddInstrument = ({leadId, updInstrument, fin_advisor, portfolio}) => {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');

  const [errors, setErrors] = useState(false);
  const [loading, setLoading] = useState(true);

  //list of possible fin_instruments
  const [options, setOptions] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [newInstrument, setNewInstrument] = useState({})

  useEffect( () => {
    //
  }, [])


  const handleSubmit = e => {
    e.preventDefault();

    fetch(Constants.SERVER_API+'fin_instrument/?symbol='+symbol, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        },
    })
    .then(res => res.json())
    .then( async (data) => {
        //data is instrument we seatched
        //id data == 0 we have no such instrument in our db
        console.log(data)
        if(data.length == 0){
            /*
                1) make request to site
                2) check result
                3) create new instrument
             */
            let apikey = fin_advisor.apikey.key

            let req_url = Constants.DATA_SOURCE_QUERY+'function=SYMBOL_SEARCH&keywords='+symbol+'&apikey='+apikey

            //fetch to get data
            fetch(req_url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(res => res.json())
            .then( data => {
                setOptions(data.bestMatches)
                setApiKey(req_url)
            })

        }else{
            /*
                1) check if lead already has this instrument
                2) update if does
                3) add if does not
            */
            var instrument_to_upd = null
            for (var row in portfolio){

                if (portfolio[row].instrument === data[0].id){
                    instrument_to_upd = portfolio[row]
                }
            }

            //lead already has such tool -> we need to update quantity
            if (instrument_to_upd != null){
                instrument_to_upd.quantity = quantity
                fetch(Constants.SERVER_API+'portfolio/'+instrument_to_upd.id, {
                    method: 'PUT',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(instrument_to_upd)
                })
                .then(res => res.json())
                .then(response_data => {
                    console.log(response_data)
                    updInstrument(response_data, 'update')
                })
            }
            else{
                //we have such instrument in db but we need to ADD it to this list
                // create new portfolio raw with this fin tool and quantity

                let new_portfolio = {}
                new_portfolio['user'] = leadId
                new_portfolio['instrument'] = data[0].id //data[0] is our  instrument
                new_portfolio['quantity'] = quantity


                //create new portfolio row
                let portfolio_create_req_url = Constants.SERVER_API+'portfolio/'
                fetch(portfolio_create_req_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(new_portfolio)
                })
                .then( res => res.json() )
                .then( response_data => {
                    //response_data is my portfolio
                    //data is instrument


                    updInstrument(data[0], 'add', response_data)

                })


            }

        }


    })
  };

  const addInstrument = (instrument_info) => {
    //check if user did not chose option that is already in DB/ check if instrument is not in db
    fetch(Constants.SERVER_API+'fin_instrument/?symbol='+instrument_info['1. symbol'], {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        },
    })
    .then(res => res.json())
    .then(data => {
        /*
            if we do not have fin instrument with this symbol data.length == 0
        */
        if(data.length != 0){
            //Check if it is present in our portfolio
            var instrument_to_upd = null
            for (var row in portfolio){
                console.log("-------------")
                console.log(portfolio[row])
                console.log(data)
                if (portfolio[row].instrument === data[0].id){
                    instrument_to_upd = portfolio[row]
                }
            }

            //lead already has such tool -> we need to update quantity
            if (instrument_to_upd != null){
                instrument_to_upd.quantity = quantity
                fetch(Constants.SERVER_API+'portfolio/'+instrument_to_upd.id, {
                    method: 'PUT',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(instrument_to_upd)
                })
                .then(res => res.json())
                .then(response_data => {
                    console.log(response_data)
                    updInstrument(response_data, 'update')
                })
            }
            else{
                //we have such instrument in db but we need to ADD it to this list
                // create new portfolio raw with this fin tool and quantity

                let new_portfolio = {}
                new_portfolio['user'] = leadId
                new_portfolio['instrument'] = data[0].id //data[0] is our  instrument
                new_portfolio['quantity'] = quantity


                //create new portfolio row
                let portfolio_create_req_url = Constants.SERVER_API+'portfolio/'
                fetch(portfolio_create_req_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(new_portfolio)
                })
                .then( res => res.json() )
                .then( response_data => {
                    //response_data is my portfolio
                    //data is instrument


                    updInstrument(data[0], 'add', response_data)

                })


            }

        }else{
            /*
                1) CREATE tool
                2) Add tool to lead
                3) Update portfolio
                4) Clear fields
            */

            let instrument = {}
            let apikey = Constants.DATA_SOURCE_QUERY+'function=SYMBOL_SEARCH&keywords='+instrument_info['1. symbol']+'&apikey='+fin_advisor.apikey.key
            setApiKey(apikey)

            instrument['symbol'] = instrument_info['1. symbol']
            instrument['name'] = instrument_info['2. name']
            instrument['type'] = instrument_info['3. type']
            instrument['region'] = instrument_info['4. region']
            instrument['apikey'] = apikey
            instrument['currency'] = instrument_info['8. currency']

            //create instrument
            let instrument_req_url = Constants.SERVER_API+'fin_instrument/'
            fetch(instrument_req_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(instrument)
            })
            .then(instrument_res => instrument_res.json())
            .then( instrument_data => {

                //create time series for this tool
                /*
                    1) Send req to data sourse
                    2) Send response to my view
                */


                let symbol_apikey = {
                    'symbol': instrument['symbol'],
                    'apikey': fin_advisor.apikey.key
                }
                //send time_series to view function via fetch
                fetch(Constants.SERVER_API+'time_series/', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(symbol_apikey)
                })



                //add instrument to portfolio
                let portfolio = {}
                portfolio['user'] = leadId
                portfolio['instrument'] = instrument_data.id //dinstrument_data.id - fin_instrument id
                portfolio['quantity'] = quantity

                let portfolio_req_url = Constants.SERVER_API+'portfolio/'

                fetch(portfolio_req_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(portfolio)
                })
                .then( portfolio_res => portfolio_res.json())
                .then(portfolio_data => {

                    console.log(instrument_data)
                    console.log(portfolio_data)

                    updInstrument(instrument_data, 'create', portfolio_data)


                })


            })
        }
    })
    setOptions([])
    setSymbol('')
    setQuantity('')
  }





    return(
      <div>
        <form onSubmit={handleSubmit}> <DjangoCSRFToken/>
                <input placeholder="Symbol" name='symbol' value={symbol} onChange={e => setSymbol(e.target.value)} />

                <input placeholder="Quantity" name='quantity' value={quantity} onChange={e => setQuantity(e.target.value)} className='ms-1'/>

                <input type="submit" value="Add / Update" className="btn btn-info ms-2" />
        </form>

        <table className="table table-striped">
            <thead>
                <tr>
                    <th scope="col">Symbol</th>
                    <th scope="col">Name</th>
                    <th scope="col">Type</th>
                    <th scope="col">Region</th>
                    <th scope="col">Actions</th>

                </tr>
            </thead>

            <tbody>

                 {console.log(options)}
                 {options.map( (option, index) => {

                    return(

                        <tr key={index} >
                            <td> {option['1. symbol']} </td>
                            <td> {option['2. name']} </td>

                            <td> {option['3. type']} </td>
                            <td> {option['4. region']} </td>


                            <td>
                                <button onClick={ () => addInstrument(option)}  type="button" className="btn btn-outline-dark">Add</button>
                            </td>


                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    )


}

export default AddInstrument;