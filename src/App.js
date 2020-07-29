import React from 'react';
import ReactDOM from 'react-dom'
import Scroller from './scroller'
//import Scroller from './scroller'
import 'react-week-calendar/dist/style.css';
import './App.css'

class App extends React.Component {
    render() {
        return (
            <div className="container">
                {/*<div className="left-div">
                    <h3 style={{textAlign:'center'}}>test react-week-calendar</h3>
                    <Scroller/>
                </div>*/}
                <Scroller/>
            </div>
        );
    }
}
ReactDOM.render(
    <App />,
    document.getElementById('root'),
)


