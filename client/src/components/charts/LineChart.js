import React, { useState, useEffect, Fragment } from 'react';
import AddInstrument from '../../views/app/AddInstrument';

import * as Constants from '../../views/dependencies';

import DjangoCSRFToken from 'django-react-csrftoken'


import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const LineChart = ({chartTimeSeries}) => {

    const [options, setOptions] = useState()

    useEffect( () => {
        console.log(chartTimeSeries)
        let new_options = {
            title: {
                text: 'Portfolio Value for Past Month'
            },
            yAxis: {
                crosshair: true,
                text: 'Close Price'
            },
            xAxis: {
                crosshair: true,
                type: 'datetime',
            },
            tooltip: {
                formatter: function() {
                    let string = "<b>DAY:</b> "+Highcharts.dateFormat('%b %e', this.x)+"</br><b>PRICE:</b> "+this.y+"<br><br>"
                    for (let instrument in this.point.instruments){
                        string += ""+instrument+": "+ this.point.instruments[instrument]+"<br>"
                    }
                    return string;
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },
            series: [chartTimeSeries]
        }

        setOptions(new_options)
    }, [chartTimeSeries])

    return(
        <div>
            <h2> Portfolio Value </h2>

            <HighchartsReact
                highcharts={Highcharts}
                options={options}
            />

        </div>
    )
}

export default LineChart