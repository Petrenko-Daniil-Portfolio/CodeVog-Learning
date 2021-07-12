import React, { useState, useEffect, Fragment } from 'react';
import AddInstrument from '../../views/app/AddInstrument';

import * as Constants from '../../views/dependencies';

import DjangoCSRFToken from 'django-react-csrftoken'


import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const BasicLineChart = ( {UpdateChartLinesMethod_ref, finInstruments, lead} ) => {

    const [symbol, setSymbol] = useState('')

    const[days, setDays] = useState([])

    const [timeSeries, setTimeSeries] = useState('')
    const [options, setOptions] = useState({})

    const [message, setMessage] = useState('Press "Show Statistics" to get all charts. Enter "Symbol" to  find specific one. Enter "Portfolio" to get portfolio value.')
    const [messageType, setMessageType] = useState('info')

    useEffect( () => {
        buildAllChartLines()
        UpdateChartLinesMethod_ref.current = buildAllChartLines // save method to state so that other child could rerender chart if new tool was added
    }, [finInstruments])

    const buildChartLine = () => {
        if (symbol === "Portfolio"){
            //send request to get portfolio_value
            fetch(Constants.SERVER_API+"portfolio_value", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({'lead': lead})
            })
            .then(res => res.json())
            .then(data => {
                console.log(data)
                let days_n_prices = [] //list to store date and portfolio price
                let portfolio_time_series = data['data-frame']

                for (let day in portfolio_time_series){
                    let price = portfolio_time_series[day]['price']
                    delete portfolio_time_series[day]['price']
                    days_n_prices.push({
                        x: Date.UTC(...day.split('-')),
                        y: price
                        })
                }
                let prev_state = {...options}
                prev_state.series = {name: 'Portfolio',data: days_n_prices}
                setOptions(prev_state)
                setSymbol('')
            })
        }
        else{
            if (symbol){
                let req_url = Constants.SERVER_API+'fin_instrument/?symbol='+ symbol
                fetch(req_url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'app/json'
                    }
                })
                .then( res => res.json() )
                .then ( instruments_data => {
                    if (instruments_data.length === 0){
                        setMessageType('warning')
                        setMessage("There Is No  Symbol '"+symbol+"'! Please be more attentive.")
                        setSymbol('')
                    }else{
                        let instrument = instruments_data[0]
                        // get time series of this tool
                        // re render chart
                        // change message to success

                        fetch(Constants.SERVER_API+'time_series_data/?instrument='+instrument.id, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'app/json'
                            }
                        })
                        .then( res => res.json() )
                        .then( time_series_data => {
                            time_series_data.sort((a,b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0)) // sort all time series from oldest to newest

                             let series_dates_n_prices = [] // all dates of chart line with it`s close prices
                             let series_name = instrument['symbol'] //name of chart line is fin tool symbol

                             //add dates to list if there is no such date
                             for (let i in time_series_data){
                                 series_dates_n_prices.push( [Date.UTC(...time_series_data[i]['date'].split('-')), parseFloat( time_series_data[i]['close_price'])  ])
                             }

                             let prev_state = {...options}
                             prev_state.series = {name: series_name, data: series_dates_n_prices}
                             setOptions(prev_state)

                             setMessage(series_name+' Time Series Were Successfully Displayed')
                             setMessageType('success')
                             setSymbol('')
                        })
                    }
                })
            }
            else{
                buildAllChartLines()
                setMessage('All Time Series Were Successfully Displayed')
                setMessageType('success')
            }
        }
    }

    const buildAllChartLines = async () => {

//        console.log("I was called")
//        console.log('+-+')
        let time_series_list = []  // list of dicts [ {name: '', data: []}, {name: '', data: []} ]


        for (let index in finInstruments){

            let instrument_id =  finInstruments[index]['id']
            let req_url = Constants.SERVER_API+'time_series_data/?instrument='+ instrument_id
            await fetch(req_url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(res => res.json())
            .then(time_series_data => {
                time_series_data.sort((a,b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0)) // sort all time series from oldest to newest

                let series_dates_n_prices = [] // all dates of chart line with it`s close prices
                let series_name = finInstruments[index]['symbol'] //name of chart line is fin tool symbol

                //add dates to list if there is no such date
                for (let i in time_series_data){

                    series_dates_n_prices.push( [Date.UTC(...time_series_data[i]['date'].split('-')), parseFloat( time_series_data[i]['close_price'])  ])

                }

                time_series_list.push( {name: series_name, data: series_dates_n_prices} )

            })

        }

        let prev_state = {
            title: {
                text: 'Financial Instruments Close Prices for past 30 Days'
            },

            yAxis: {
//                type: "linear",
//                tickInterval: 1,
                title: {
                    text: 'Close Prices'
                }
            },

            xAxis: {
                type: 'datetime',
            },

            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },

            series: time_series_list

        }
        console.log(time_series_list)
        console.log(prev_state['series'])

        setOptions(prev_state)
    }

        return(

            <div>

                <h2>Charts</h2>

                <form className="text-start"> <DjangoCSRFToken/>
                    <input placeholder="Symbol" name='symbol' value={symbol} onChange={e => setSymbol(e.target.value)} />

                    <button onClick={ () => buildChartLine()} className="btn btn-primary ms-2" type="button">Show Statistics</button>
                </form>
                <br/>

                <div className={'alert alert-'+messageType}> {message} </div>

                <HighchartsReact
                  highcharts={Highcharts}
                  //constructorType = { 'mapChart' }  NOT WORKING PROPERLY
                  options={options}
                />

            </div>


       )


}

export default BasicLineChart;






/*const App = () => <div>
  <HighchartsReact
    highcharts={Highcharts}
    options={options}
  />
</div>
*/