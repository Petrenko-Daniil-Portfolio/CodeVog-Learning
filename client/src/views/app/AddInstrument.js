import React, { Component, useState, useEffect } from "react";
import { render } from "react-dom";
import DjangoCSRFToken from 'django-react-csrftoken'

const AddInstrument = ({updInstrument, user_id, portfolio}) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');

  const [errors, setErrors] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect( () => {

  }, [])

  const handleSubmit = e => {
    e.preventDefault();

    fetch('http://127.0.0.1:8000/api/fin_instrument/?symbol='+symbol+'&name='+name, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        },
    })
    .then(res => res.json())
    .then( async (data) => {

        //id data == 0 we have no such instrument in our db
        if(data.length == 0){
            /*
                1) make request to site
                2) check result
                3) create new instrument
             */
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

            instrument_to_upd.quantity = quantity

            //lead already has such tool -> we need to update quantity
            if (instrument_to_upd != null){
                fetch('http://127.0.0.1:8000/api/portfolio/'+instrument_to_upd.id, {
                    method: 'PUT',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(instrument_to_upd)
                })
                .then(res => res.json())
                .then(response_data => {
                    console.log(response_data)
                    updInstrument(response_data)
                })
            }
            else{
                //we have such instrument in db but we need to add it to this list
            }

        }


    })



  };


    return(
        <form onSubmit={handleSubmit}> <DjangoCSRFToken/>

                <input placeholder="Name" name='name' value={name} onChange={e => setName(e.target.value)} />



                <input placeholder="Symbol" name='symbol' value={symbol} onChange={e => setSymbol(e.target.value)} />



                <input placeholder="Quantity" name='quantity' value={quantity} onChange={e => setQuantity(e.target.value)} />



                <input type="submit" value="Add Instrument"/>

        </form>
    )


}

export default AddInstrument;