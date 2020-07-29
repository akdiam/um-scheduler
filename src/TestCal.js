import React from 'react'
import WeekCalendar from 'react-week-calendar';
import moment from 'moment'
import 'react-week-calendar/dist/style.css';
import { mockComponent } from 'react-dom/test-utils';

export default class TestCal extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <WeekCalendar
                startTime={moment({h:7, m:0})}
                endTime={moment({h:21, m:30})}
                scaleHeaderTitle={""}
                numberOfDays={5}
                scaleUnit={30}
                firstDay={moment().day(1)}
                dayFormat={'dddd'}
                useModal={false}
                selectedIntervals={this.props.selectedIntervals}
            />
        )
    }
}