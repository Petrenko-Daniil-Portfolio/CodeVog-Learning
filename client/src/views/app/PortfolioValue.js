import React, { useState, useEffect, useRef, Fragment } from 'react';
import * as Constants from '../dependencies';

import CheckAccess from '../../components/utils/check_access';
import LineChart from '../../components/charts/LineChart';

const PortfolioValue = (props) =>{

    const [user, setUser] = useState(''); // user is the one who entered page
    const [lead, setLead] = useState(''); // lead is the one whose id was passed in url

    const [chartTimeSeries, setChartTimeSeries] = useState({})
    const [rawChartTimeSeries, setRawChartTimeSeries] = useState({})

    useEffect( () => {
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
            .then(user_data => {
              setUser(user_data)

              //get lead
              fetch(Constants.SERVER_API+'lead/'+props.match.params.id, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Token ${localStorage.getItem('token')}`
                }
              })
                .then(res => res.json())
                .then(lead_data => {
                    setLead(lead_data);

                    //If user that entered page is not owner or staff -> redirect
                    if (user.id != lead_data.id && user.is_staff == false){
                        window.location.replace(Constants.SITE_URL+'Logout');
                    }

                    //send request to get portfolio_value
                    fetch(Constants.SERVER_API+"portfolio_value", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({'lead': lead_data})
                    })
                    .then(res => res.json())
                    .then(data => {
                        console.log(data)
                        setRawChartTimeSeries(data)
                        let days_n_prices = [] //list to store date and portfolio price
                        let portfolio_time_series = data['data-frame']

                        for (let day in portfolio_time_series){
                            let price = portfolio_time_series[day]['price']
                            delete portfolio_time_series[day]['price']
                            days_n_prices.push({
                                x: Date.UTC(...day.split('-')),
                                y: price,
                                instruments: portfolio_time_series[day]
                                })
                        }

                        setChartTimeSeries( {name: 'Portfolio',data: days_n_prices} )

                    })
                })
            })
        }
    }, [])

    const downloadPortfolioAsExcel = () => {

        // send request to server api to get excel file with portfolio information
        let req_url = Constants.SERVER_API + "statistics/" + lead.id
        fetch(req_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rawChartTimeSeries)
        })
        .then(response => {
            // response.blob() - reads request till its end and results(returns) in a blob object
            return response.blob()})
        .then(blob => {
            //blob (Binary Large Object) - represent binary data, and they can be large, but neither is required

            //URL.createObjectURL(blob) - method creates DOMString, containing URL representing the object given in the parameter.
            var file = window.URL.createObjectURL(blob);

            //Location.assign(file) - method causes the window to load and display the document at the URL specified
            window.location.assign(file);
        })


    }

    return(
        <div>
            {/* <h2>Portfolio Value Page</h2> */}

            {Object.entries(chartTimeSeries).length > 0  &&
                <LineChart chartTimeSeries = {chartTimeSeries}/>

            }
            <br />
            <button onClick = { () => downloadPortfolioAsExcel() } type="button" className="btn btn-primary w-100">Download Portfolio As Excel</button>
        </div>

    )
}


export default PortfolioValue