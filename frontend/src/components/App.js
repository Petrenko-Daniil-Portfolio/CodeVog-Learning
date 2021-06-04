import React, { Component } from "react";
import { render } from "react-dom";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loaded: false,
      placeholder: "Loading"
    };
  }

  componentDidMount() {
    fetch("api/lead")
      .then(response => {
        if (response.status > 400) {
          return this.setState(() => {
            return { placeholder: "Something went wrong!" };
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
                <th>Email</th>
            </tr>
            {this.state.data.map(contact => {
              return (
                <tr key={contact.id}>
                    <td style={{"margin": "1px", "padding": "5px"}}>{contact.name}</td>
                    <td style={{"color": "blue","margin": "1px", "padding": "5px"}}>{contact.email}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    );
  }
}

export default App;

const container = document.getElementById("app");
render(<App />, container);