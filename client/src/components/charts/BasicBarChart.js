import React, {useState, useEffect, Fragment} from 'react';
import * as Constants from '../../views/dependencies'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const BasicBarChart = ( {user} ) =>{
    const[options, setOptions] = useState({})

    useEffect( () => {

        // send request to SERVER API to get all users portfolios
        fetch(Constants.SERVER_API+'portfolio_values/'+user.pk, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(res => res.json())
        .then(portfolios_prices => {
            //const [key, value] of Object.entries
            const time_series_list = []

            for (const[lead, time_series_data] of Object.entries(portfolios_prices['data-frames'])){

                //  time_series_data.sort((a,b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0)) // sort all time series from oldest to newest

                let series_dates_n_prices = [] // all dates of chart line with it`s close prices
                let series_name = lead //name of chart line is fin tool symbol

                //add dates to list if there is no such date
                for (let day in time_series_data){

                    series_dates_n_prices.push( [Date.UTC(...day.split('-')), parseFloat( time_series_data[day]['price'])  ])

                }

                time_series_list.push( {name: series_name, data: series_dates_n_prices} )
            }

            let new_options = {
                chart: {
                    type: 'column',
                    height: 400,
                },
                title: {
                    text: 'Leads Portfolio Prices for past 30 Days',
                    style: {
                            fontSize: '25px',
                        },
                },
                //subtitle: {
                //  text: 'Source: WorldClimate.com'
                //},
                xAxis: {
//                    type: "linear",
//                    tickInterval: 1,
                    type: 'datetime',
                    title: {
                            text: 'Days',
                            style: {
                                fontSize: '15px',
                            }
                        },
                    labels: {
                        style: {
                            fontSize: '13px',
                        }
                    }
//                    crosshair: {
//                        color: 'grey',
//                        width: 18,
//                        snap: true,
//                        //dashStyle: 'shortdot'
//                    },
                },
                yAxis: {
                    //type: "linear",
                    //tickInterval: 1,
                    title: {
                        text: 'Close Prices'
                    },
                    labels: {
                        style: {
                            fontSize: '12pt',
                        }
                    }
                },
                tooltip: {

                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0,
                        borderWidth: 0,
                        pointWidth: 15,

                        states: {
                            hover:{
                                brightness: -0.3, // darken
                                borderWidth: 2,
                                borderColor: 'orange'
                            }
                        }
                    }
                },
                series: time_series_list

            }

            setOptions(new_options)

        })
    }, [])

    return(
        <Fragment>

            <HighchartsReact
                      highcharts={Highcharts}
                      //constructorType = { 'mapChart' }  NOT WORKING PROPERLY
                      options={options}
            />

        </Fragment>
    )
}

export default BasicBarChart