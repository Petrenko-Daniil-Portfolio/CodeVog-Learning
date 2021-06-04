import React, { Component } from "react";
import { render } from "react-dom";

class Test extends React.Component{
    constructor(props){
        super(props)
        this.state = {date: new Date()}
    }

    componentDidMount(){
        this.timerID = setInterval(() => this.tick(), 1000);
    }

    tick(){
        this.setState({date: new Date()})
    }

    componentWillUnmount(){
        clearInterval(this.timerID);
    }

    render(){
        return (
            <div className='centered-text'>
                <h1> Оль, я зробив React-ивний годинник</h1>
                <h2> It is {this.state.date.toLocaleTimeString()}</h2>
            </div>
        )
    }
}

export default Test;

const container = document.getElementById("test");
render(<Test />, container);