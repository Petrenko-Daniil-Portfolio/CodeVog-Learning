import React, { Component } from "react";
import { render } from "react-dom";

class Fin_instruments extends Component{
    constructor(props){
        super(props)
        this.state = {
            data: [],
            loaded: false,
            placeholder: 'Loading...'
        };;
    }

    componentDidMount(){
        fetch('api/leads') //CHANGE URL !!!
            .then(response => {
                if (response.status > 400){
                    return this.setState(() => {
                        return {placeholder: "Something went wrong!"};
                    });
                }
                return response.json();
            })
            .then(data => {
                this.setState(() => {
                    return {
                        data,
                        loaded: true
                    };
                });
            });
    }

    render() {
        return (
            <table>
                <tbody>
                    <tr>
                        <th>Name</th>
                        <th>Symbol</th>
                        <th>Quantity</th>
                        <th>Type</th>
                        <th>Region</th>
                    </tr>
                    {this.state.data.map(fin_instrument => {
                        return (
                            <tr key={fin_instrument.id}>

                                <td>{fin_instrument.Name}</td>
                                <td>{fin_instrument.Symbol}</td>
                                <td>{fin_instrument.Quantity}</td>
                                <td>{fin_instrument.Type}</td>
                                <td>{fin_instrument.Region}</td>

                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }
}





export default Fin_instruments;

const container = document.getElementById("fin_instruments");
render(<Fin_instruments />, container);