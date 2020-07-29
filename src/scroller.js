import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import {ClassNames} from './ClassNames';
import Button from '@material-ui/core/Button'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import ClassListing from './FA2020';
import TestCal from './TestCal'
import moment from 'moment'
import Moment from 'moment'
import {extendMoment} from 'moment-range';

const buttonStyle = {
    padding: 25,
    right: 0,
};

const scrollerboxes = {
    borderRadius: 0,
    height: 40,
    margin: 1,
    padding: 5,
}

const headaerStyle = {
    topMargin: 10,
    topPadding: 50,
    fontSize: "large",
}

const spacingStyle = {
    padding: 15,
}

const descriptionStyle = {
    fontSize: "medium"
}

const animatedComponents = makeAnimated();
export default class Scroller extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ClassNames,
            value: {label: 'Default value', key: '01'},
            showSubjs: true,
            showClassList: false,
            showClassDesc: false,

            // eg ("AEROSP, EECS, PSYCH")
            CurrentSubj: '',

            // array containing one of each catalog number (eg 101, 110, etc) (json obj)
            FilteredClassList: [],
            // array containing every class in a given subject (json obj)
            CompleteClassList: [],
            // array containing every class of a given course catalog num (json obj)
            SpecificClassList: [],

            // array of json objects for each specifically selected class
            LecArray: [],
            DiscArray: [],
            LabArray: [],
            SemArray: [],
            RecArray: [],

            // displays of items in each dropdown menu
            LecDisplays: null,
            DiscDisplays: null,
            LabDisplays: null,
            SemDisplays: null,
            RecDisplays: null,

            // course number (eg 183, 280, 281)
            SelectedClass: null,

            // name of currently selected class
            FullSelectedClass: null,
            LecToGenerate: null,

            // containers of selections of dropdown menus
            SelectedLecs: [],
            SelectedDiscs: [],
            SelectedLabs: [],
            SelectedSems: [],
            SelectedRecs: [],

            // container of all selected classes to go on schedule
            ScheduledClasses: [],

            // container of displayed classes on sched/all classes on sched
            selectedIntervals: [],
            allIntervals: [],
            allSelectedIntervals: [],
            timeIntervals: [],
            curr_index: 0,
            numSchedules: 1,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
    }

    // formats time slots for events on calendar
    formatTime = unformattedTime => {
        if (unformattedTime === "ARR") {
            return null
        }

        let start = unformattedTime.substr(0, unformattedTime.indexOf('-'))
        let end = unformattedTime.split(/[- ABCDEFGHIJKLMNOPQRSTUVWXYZ]/)[1]
        console.log(end)
        let ampm = unformattedTime.split(/[- 0123456789]/).slice(-1)[0]
        console.log(ampm)
        let start_hour
        let start_min
        let end_hour
        let end_min
        if (start.includes("30")) {
            let hour = start.substr(0, start.indexOf("30"));
            start_hour = parseInt(hour);
            start_min = 30
        } else {
            start_hour = parseInt(start);
            start_min = 0;
        }
        if (end.includes("30")) {
            let hour = end.substr(0, end.indexOf("30"));
            end_hour = parseInt(hour);
            end_min = 30
        } else {
            end_hour = parseInt(end);
            end_min = 0;
        }

        if (start_hour >= 8 && start_hour <= 12 && end_hour > 0 && end_hour <= 9 && ampm === "PM") {
            end_hour += 12;
        } if (start_hour > 0 && start_hour <= 8 && ampm === "PM") {
            start_hour += 12;
            end_hour += 12;
        }

        let start_obj = {}
        let end_obj = {}
        start_obj["hour"] = start_hour;
        start_obj["min"] = start_min;
        end_obj["hour"] = end_hour;
        end_obj["min"] = end_min;
        return ({ 
            start_obj, end_obj
        })
    }

    formatDays = unformattedDays => {
        let days = [];
        if (unformattedDays.includes('M')) {
            days.push(1)
        }
        if (unformattedDays.includes('T')) {
            days.push(2)
        }
        if (unformattedDays.includes('W')) {
            days.push(3)
        }
        if (unformattedDays.includes('R')) {
            days.push(4)
        }
        if (unformattedDays.includes('F')) {
            days.push(5)
        }
        return days
    }

    // used in handleAdd - setting up format for actual events to be displayed on calendar

    // push all sections into a temp array
    // include the formatted timeslot of each obj with its corresponding section
    // set the corresponding key of obj to the collected sections
    handleScheduling = selected_list => {
        let innerobj = {}
        let class_arr = []
        for(let i = 0; i < selected_list.length; ++i) {
            innerobj["description"] = selected_list[i];
            innerobj["timeslot"] = this.formatTime(selected_list[i]['time'])
            innerobj["days"] = this.formatDays(selected_list[i]['days'])
            innerobj["section"] = selected_list[i]['section']
            class_arr.push(innerobj);
            innerobj = {};
            console.log(this.formatTime(selected_list[i]['time']))
        }
        // set the corresponding key of obj to the collected sections
        return class_arr
    }

    // adds all intervals of a class's lectures/discussions/labs/sems/recs to interval_arr
    // used in handleAdd
    addAllIntervals = (unformattedIntervals, class_name, class_type) => {
        let innerobj = {}
        let interval_arr_out = []
        let interval_arr_in = []
        for (let i = 0; i < unformattedIntervals.length; ++i) {
            let no_days = false;
            let no_time = false;
            if (unformattedIntervals[i]['days'].length === 0) {
                no_time = true;
            }
            if (unformattedIntervals[i]['time'] === 'ARR') {
                no_days = true;
            }
            for (let j = 0; j < unformattedIntervals[i]['days'].length; ++j) {
                innerobj['uid'] = class_name
                innerobj['start'] = moment({h: unformattedIntervals[i]['timeslot']['start_obj']['hour'], 
                                            m: unformattedIntervals[i]['timeslot']['start_obj']['min']})
                                            .day(unformattedIntervals[i]['days'][j])
                innerobj['end'] = moment({h: unformattedIntervals[i]['timeslot']['end_obj']['hour'], 
                                            m: unformattedIntervals[i]['timeslot']['end_obj']['min']})
                                            .day(unformattedIntervals[i]['days'][j])
                innerobj['value'] = class_name + " " + class_type + " " + unformattedIntervals[i]['section']
                + " ID: " + unformattedIntervals[i]['description']['value']
                interval_arr_in.push(innerobj)
                innerobj = {}
            }
            // if there are no days scheduled
            if (!no_time && !no_days) {
                interval_arr_out.push(interval_arr_in)
            }
            interval_arr_in = [];
        }
        return interval_arr_out
    }

    // checks for conflicts between two time slots
    check_conflicts = (start_time1, end_time1, start_time2, end_time2) => {
        const mom = extendMoment(Moment);
        let date1 = [start_time1, end_time1];
        let date2 = [start_time2, end_time2];
        let range1 = mom.range(date1);
        let range2 = mom.range(date2);
        if (range1.overlaps(range2)) {
            return true;
        }
        return false;
    }

    // add to array of all selectedIntervals 
    update_selectedIntervals = (all_schedules, interval_obj) => {
        let conflict_counter = 0;
        let noconflict_counter = 0;
        // set up selected intervals
        let new_all = []
        if (interval_obj.length === 0) {
            return [all_schedules, true]
        }

        if (all_schedules.length === 0) {
            console.log('true')
            for (let i = 0; i < interval_obj.length; ++i) {
                let inner_arr = [];
                for (let j = 0; j < interval_obj[i].length; ++j) {
                    inner_arr.push(interval_obj[i][j])
                }
                new_all.push(inner_arr)
            }
            return [new_all, true]
        } 
        // add to existing selected intervals
        else {
            // over container of all intervals 
            for (let k = 0; k < interval_obj.length; ++k) {
                //(allSelectedIntervals)
                for (let i = 0; i < all_schedules.length; ++i) {
                    // over each specific selectedInterval
                    let has_conflict = false;
                    for (let j = 0; j < all_schedules[i].length; ++j) {
                        // over each time interval within the interval_obj
                        for (let h = 0; h < interval_obj[k].length; ++h) {
                            if (this.check_conflicts(all_schedules[i][j]['start'], all_schedules[i][j]['end'], 
                                                    interval_obj[k][h]['start'], interval_obj[k][h]['end'])) {
                                has_conflict = true;
                            } 
                            // check if time or days dont exist here
                        }
                    } 
                    if (!has_conflict) {
                        let concatted_sched = all_schedules[i].concat(interval_obj[k])
                        new_all.push(concatted_sched)
                        ++noconflict_counter
                    } 
                    else {
                        ++conflict_counter
                    }
                }
            }
        }
        // find better way to see if all classes conflict
        if (conflict_counter >= all_schedules.length && noconflict_counter < conflict_counter) {
            alert("Couldn't add class to schedule: conflicted with every possible schedule")
            return [all_schedules, false];
        } 
        else {
            return [new_all, true];
        }
    }

    // handle clicks on the scroller
    handleClick = event => {
        // if the user clicks on a subject...
        if (this.state.showSubjs && !this.state.showClassList && !this.state.showClassDesc) {
            // filters relevant classes 
            let subj_to_find = '(' + event.target.innerText + ')';
            let relevant_classes = ClassListing.filter(subj => subj['Subject'].includes(subj_to_find));
            
            // filters duplicate catalog numbers 
            let seen_nbrs = {}
            const filtered_classes = relevant_classes.filter(subj => {
                if (subj['Catalog Nbr'] in seen_nbrs) {
                    return false;
                } else {
                    seen_nbrs[subj['Catalog Nbr']] = true;
                    return true;
                }
            })

            // sets state after updating information
            this.setState({
                showSubjs: false,
                showClassList: true,
                CurrentSubj: event.target.innerText,
                FilteredClassList: filtered_classes,
                CompleteClassList: relevant_classes,
            })
        } 
        
        // if the user clicks on a class...
        if (this.state.showClassList) {
            let specific_class_list = this.state.CompleteClassList.filter(subj => subj['Catalog Nbr'] === event.currentTarget.id)
            const lecs = specific_class_list.filter(subj => subj['Component'] === 'LEC')
            const discs = specific_class_list.filter(subj => subj['Component'] === 'DIS')
            const labs = specific_class_list.filter(subj => subj['Component'] === 'LAB')
            const sems = specific_class_list.filter(subj => subj['Component'] === 'SEM')
            const recs = specific_class_list.filter(subjs => subjs['Component'] === 'REC')

            let temp_lec = [];
            let temp_disc = [];
            let temp_lab = [];
            let temp_sems = [];
            let temp_recs = [];
            
            // gathering info to send to dropdown menus to display
            // sorry i know it's ugly
            for (let i = 0; i < lecs.length; ++i) {
                let disp_obj = {};
                disp_obj["value"] = lecs[i]['Class Nbr']
                disp_obj["label"] = "Section: " + lecs[i]['Section'] + ", Days: "
                + lecs[i]['M']+lecs[i]['T']+lecs[i]['W']+lecs[i]['TH']+lecs[i]['F']
                + ", Time: " + lecs[i]['Time'] + ", ID: " + lecs[i]['Class Nbr']
                disp_obj["time"] = lecs[i]['Time']
                let thurs = ''
                if (lecs[i]['TH'] === 'TH') {
                    thurs = 'R'
                }
                disp_obj["days"] = lecs[i]['M']+lecs[i]['T']+lecs[i]['W']+thurs+lecs[i]['F']
                disp_obj["section"] = lecs[i]['Section']
                temp_lec.push(disp_obj);
            }
            for (let i = 0; i < discs.length; ++i) {
                let disp_obj = {};
                disp_obj["value"] = discs[i]['Class Nbr']
                disp_obj["label"] = "Section: " + discs[i]['Section'] + ", Days: "
                + discs[i]['M']+discs[i]['T']+discs[i]['W']+discs[i]['TH']+discs[i]['F']
                + ", Time: " + discs[i]['Time'] + ", ID: " + discs[i]['Class Nbr']
                disp_obj["time"] = discs[i]['Time']
                let thurs = ''
                if (discs[i]['TH'] === 'TH') {
                    thurs = 'R'
                }
                disp_obj["days"] = discs[i]['M']+discs[i]['T']+discs[i]['W']+thurs+discs[i]['F']
                disp_obj["section"] = discs[i]['Section']
                temp_disc.push(disp_obj);
            }
            for (let i = 0; i < labs.length; ++i) {
                let disp_obj = {};
                disp_obj["value"] = labs[i]['Class Nbr']
                disp_obj["label"] = "Section: " + labs[i]['Section'] + ", Days: "
                + labs[i]['M']+labs[i]['T']+labs[i]['W']+labs[i]['TH']+labs[i]['F']
                + ", Time: " + labs[i]['Time'] + ", ID: " + labs[i]['Class Nbr']
                disp_obj["time"] = labs[i]['Time']
                let thurs = ''
                if (labs[i]['TH'] === 'TH') {
                    thurs = 'R'
                }
                disp_obj["days"] = labs[i]['M']+labs[i]['T']+labs[i]['W']+thurs+labs[i]['F']
                disp_obj["section"] = labs[i]['Section']
                temp_lab.push(disp_obj);
            }
            for (let i = 0; i < sems.length; ++i) {
                let disp_obj = {};
                disp_obj["value"] = sems[i]['Class Nbr']
                disp_obj["label"] = "Section: " + sems[i]['Section'] + ", Days: "
                + sems[i]['M']+sems[i]['T']+sems[i]['W']+sems[i]['TH']+sems[i]['F']
                + ", Time: " + sems[i]['Time'] + ", ID: " + sems[i]['Class Nbr']
                disp_obj["time"] = sems[i]['Time']
                let thurs = ''
                if (sems[i]['TH'] === 'TH') {
                    thurs = 'R'
                }
                disp_obj["days"] = sems[i]['M']+sems[i]['T']+sems[i]['W']+thurs+sems[i]['F']
                disp_obj["section"] = sems[i]['Section']
                temp_sems.push(disp_obj);
            }
            for (let i = 0; i < recs.length; ++i) {
                let disp_obj = {};
                disp_obj["value"] = recs[i]['Class Nbr']
                disp_obj["label"] = "Section: " + recs[i]['Section'] + ", Days: "
                + recs[i]['M']+recs[i]['T']+recs[i]['W']+recs[i]['TH']+recs[i]['F']
                + ", Time: " + recs[i]['Time'] + ", ID: " + recs[i]['Class Nbr']
                disp_obj["time"] = recs[i]['Time']
                let thurs = ''
                if (recs[i]['TH'] === 'TH') {
                    thurs = 'R'
                }
                disp_obj["days"] = recs[i]['M']+recs[i]['T']+recs[i]['W']+thurs+recs[i]['F']
                disp_obj["section"] = recs[i]['Section']
                temp_recs.push(disp_obj);
            }

            // update state
            this.setState({
                showClassList: true,
                showCourseDesc: true,
                LecArray: lecs,
                DiscArray: discs,
                LabArray: labs,
                SemArray: sems,
                RecArray: recs,
                SelectedClass: event.currentTarget.id,
                SpecificClassList: specific_class_list,
                LecDisplays: temp_lec,
                DiscDisplays: temp_disc,
                LabDisplays: temp_lab,
                SemDisplays: temp_sems,
                RecDisplays: temp_recs,
                FullSelectedClass: event.currentTarget.innerText,
                SelectedLecs: [],
                SelectedDiscs: [],
                SelectedLabs: [],
                SelectedSems: [],
                SelectedRecs: [],
            })
        } 
    }

    // updates the appropriate state arrays 
    // when class times are selected
    handleChange = (value, action) => {
        console.log(action.name)
        if (action.name === 'lecs') {
            this.setState({SelectedLecs:value})
        } if (action.name === 'disc') {
            this.setState({SelectedDiscs:value})
        } if (action.name === 'lab') {
            console.log(action.name)
            console.log(value)
            this.setState({SelectedLabs:value})
        } if (action.name === 'sem') {
            this.setState({SelectedSems:value})
        } if (action.name === 'rec') {
            this.setState({SelectedRecs:value})
        }
    }

    handleBack = () => {
        this.setState({
            showSubjs: true,
            showClassDesc: false,
            showClassList: false,
            showCourseDesc: false,
            FullSelectedClass: null,
            SelectedLecs: [],
            SelectedDiscs: [],
            SelectedLabs: [],
            SelectedSems: [],
            SelectedRecs: [],
            LecDisplays: null,
            DiscDisplays: null,
            LabDisplays: null,
            SemDisplays: null,
            RecDisplays: null,
            FullSelectedClass: null,
            SpecificClassList: null,
            CurrentSubj: null,
            FilteredClassList: null,
            CompleteClassList: null,
            SpecificClassList: null,
            SelectedClass: null,
            LecArray: null,
        })
    }

    // adds selected values to an array called ScheduledClasses
    handleAdd = () => {
        // add all of the selected options to the calendar display array
        let obj = {};
        let intervalObj = {};
        let potentialSelected = [];

        // seriously keeps track of all selected
        let temp_allSelectedIntervals = this.state.allSelectedIntervals

        obj["class"] = this.state.CurrentSubj+this.state.SelectedClass;
        intervalObj["class"] = this.state.CurrentSubj+this.state.SelectedClass;
        // push all of the selected class info into the scheduled classes container in state
        if (this.state.SelectedLecs !== null && this.state.SelectedLecs.length !== 0) {
            obj["lecs"]=this.handleScheduling(this.state.SelectedLecs);
            // set up selectedInterval (currently displayed classes)
            // add everything selected lec into all intervals, choose first of those to actually display
            intervalObj["LEC"] = this.addAllIntervals(obj["lecs"], obj["class"], "LEC") 
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["LEC"])
            temp_allSelectedIntervals = temp[0]

            // if these lectures didn't fit, don't include them in allintervals or scheduledclasses
            // this helps when a class is deleted so no surprise conflicts are made when rescheduling
            if (!temp[1]) {
                delete obj["lecs"]
                delete intervalObj["LEC"]
            }
        }
        if (this.state.SelectedDiscs !== null && this.state.SelectedDiscs.length !== 0) {
            obj["discs"]=this.handleScheduling(this.state.SelectedDiscs);
            intervalObj["DIS"] = this.addAllIntervals(obj["discs"], obj["class"], "DIS")
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["DIS"])
            temp_allSelectedIntervals = temp[0]
            if (!temp[1]) {
                delete obj["discs"]
                delete intervalObj["DIS"]
            }
        }
        if (this.state.SelectedLabs !== null && this.state.SelectedLabs.length !== 0) {
            obj["labs"]=this.handleScheduling(this.state.SelectedLabs);
            intervalObj["LAB"] = this.addAllIntervals(obj["labs"], obj["class"], "LAB")
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["LAB"])
            temp_allSelectedIntervals = temp[0]
            if (!temp[1]) {
                delete obj["labs"]
                delete intervalObj["LAB"]
            }
        }
        if (this.state.SelectedSems !== null && this.state.SelectedSems.length !== 0) {
            obj["sems"]=this.handleScheduling(this.state.SelectedSems);
            intervalObj["SEM"] = this.addAllIntervals(obj["sems"], obj["class"], "SEM")
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["SEM"])
            temp_allSelectedIntervals = temp[0]
            if (!temp[1]) {
                delete obj["sems"]
                delete intervalObj["SEM"]
            }
        }
        if (this.state.SelectedRecs !== null && this.state.SelectedRecs.length !== 0) {
            obj["recs"]=this.handleScheduling(this.state.SelectedRecs);
            intervalObj["REC"] = this.addAllIntervals(obj["recs"], obj["class"], "REC")
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["REC"])
            temp_allSelectedIntervals = temp[0]
            if (!temp[1]) {
                delete obj["recs"]
                delete intervalObj["REC"]
            }
        }

        if (!('lecs' in obj) && !('discs' in obj) && !('labs' in obj) && !('sems' in obj) && !('recs' in obj)) {
            //obj = {}
            return
        }
        if (!('LEC' in intervalObj) && !('DIS' in intervalObj) && !('LAB' in intervalObj) 
        && !('REC' in intervalObj) && !('SEM' in intervalObj)) {
            //intervalObj = {}
            return
        }

        let new_sched_size = temp_allSelectedIntervals.length;
        if (new_sched_size === 0) {
            new_sched_size = 1
        }
        // update state
        this.setState({
            SelectedLecs: [],
            SelectedDiscs: [],
            SelectedLabs: [],
            SelectedSems: [],
            SelectedRecs: [],
            ScheduledClasses: this.state.ScheduledClasses.concat(obj),
            allIntervals: this.state.allIntervals.concat(intervalObj),
            selectedIntervals: temp_allSelectedIntervals[0],
            allSelectedIntervals: temp_allSelectedIntervals,
            numSchedules: new_sched_size,
            curr_index: 0,
        })
    }

    already_seen = (seen, subj) => {
        if (seen.length === 0) {
            return false
        }
        let same_count = 0
        for (let i = 0; i < seen.length; ++i) {
            same_count = 0
            for (let k = 0; k < seen[i].length; ++k) {
                for (let j = 0; j < subj.length; ++j) {
                    let startb = true
                    let endb = true
                    let uidb = true
                    let valueb = true

                    if (seen[i][k]['end'] === subj[j]['end']) {
                        endb = false
                    }
                    if (seen[i][k]['start'] === subj[j]['start']) {
                        startb = false
                    }
                    if (seen[i][k]['uid'] === subj[j]['uid']) {
                        uidb = false
                    }
                    if (seen[i][k]['value'] === subj[j]['value']) {
                        valueb = false
                    }
                    if (!endb && !startb && !uidb && !valueb) {
                        ++same_count
                    }
                }
                if (same_count === seen[i].length) {
                    return true
                }
            }   
        }
        return false
    }

    // deleting a class from the calendar
    handleDel = () => {
        let fullname = this.state.FullSelectedClass;
        let new_array = this.state.ScheduledClasses.filter(subj => fullname.includes(subj['class']) === false)
        let new_array_all_intervals = this.state.allIntervals.filter(subj => fullname.includes(subj['class']) === false)
        let new_selected_intervals, new_num_sched

        let filtered_scheds = []
        // remake all possible schedules
        for (let i = 0; i < new_array_all_intervals.length; ++i) {
            if ('lecs' in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['LEC'])
                filtered_scheds = temp[0]
            }
            if (('discs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['DIS'])
                filtered_scheds = temp[0]
            }
            if (('labs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['LAB'])
                filtered_scheds = temp[0]
            }
            if (('sems') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['SEM'])
                filtered_scheds = temp[0]
            }
            if (('recs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['REC'])
                filtered_scheds = temp[0]
            } 
        }

        if (filtered_scheds.length !== 0) {
            new_selected_intervals = filtered_scheds[0]
            new_num_sched = filtered_scheds.length
        } else {
            new_selected_intervals = []
            new_num_sched = 1
        }

        this.setState({
            ScheduledClasses: new_array,
            allIntervals: new_array_all_intervals,
            selectedIntervals: new_selected_intervals,
            allSelectedIntervals: filtered_scheds,
            curr_index: 0,
            numSchedules: new_num_sched
        })
    }

    // previous permutation
    handlePrev = () => {
        let new_curr_index 
        if (this.state.curr_index === 0) {
            new_curr_index = this.state.numSchedules - 1
        } else {
            new_curr_index = this.state.curr_index - 1
        }
        this.setState({
            curr_index: new_curr_index,
            selectedIntervals: this.state.allSelectedIntervals[new_curr_index],
        })
    }

    // next permutation
    handleNext = () => {
        let new_curr_index
        if (this.state.curr_index + 1 === this.state.numSchedules) {
            new_curr_index = 0
        } else {
            new_curr_index = this.state.curr_index + 1
        }
        this.setState({
            curr_index: new_curr_index,
            selectedIntervals: this.state.allSelectedIntervals[new_curr_index],
        })
    }

    render() {
        let displayed_scroller;
        let add_rm_buttons;
        let lecture_choices;
        let disc_choices;
        let lab_choices;
        let sem_choices;
        let rec_choices;
        let class_header;
        let back_btn;
        let del_btn;    
        let nextprev = 
        <div className = "btn"> 
            <Button variant="contained" className="backbtn" onClick={this.handlePrev}>Back</Button>
            <div className = "pages">{this.state.curr_index+1}/{this.state.numSchedules}</div>
            <Button variant="contained" className="forbtn" onClick={this.handleNext}>Next</Button>
        </div>

        {/* controls the display for subject listing */}
        if (this.state.showSubjs && !this.state.showClassList && !this.state.showClassDesc) {
            displayed_scroller = <InfiniteScroll
            dataLength={this.state.ClassNames.length}
            hasMore={false}
            height={270}
            >
            {this.state.ClassNames.map((name, index) => (
                <div style = {scrollerboxes} key = {index} value = {name}>
                    <Button fullWidth variant="outlined" size="large" onClick = {this.handleClick}>{name}</Button> 
                </div>
            ))}
            </InfiniteScroll>
        } 
        
        {/* controls the display for specific class listings */}
        if (this.state.showClassList && !this.state.showSubjs && !this.state.showCourseDesc) {
            back_btn = 
            <Button variant="outlined" size="small" onClick={this.handleBack} color="secondary">
                Back to Subjects
            </Button>

            displayed_scroller = <InfiniteScroll
            dataLength={this.state.FilteredClassList.length}
            hasMore={false}
            height={270}
            >
            {this.state.FilteredClassList.map((item, index) => (
                <div style = {scrollerboxes} key = {index} value = {item}>
                    <Button fullWidth variant="outlined" size="large" id={item['Catalog Nbr']} onClick = {this.handleClick}>
                        {this.state.CurrentSubj} {item['Catalog Nbr']}: {item['Course Title']}
                    </Button> 
                </div>
            ))}
            </InfiniteScroll>
        }
        
        {/* controls the display for class descriptions and add/remove btn */}
        if (this.state.showClassList && this.state.showCourseDesc) {
            back_btn = 
            <Button variant="outlined" size="small" onClick={this.handleBack} color="secondary">
                Back to Subjects
            </Button>

            class_header = 
            <div style={headaerStyle}>
                <strong style = {headaerStyle}>{this.state.FullSelectedClass}</strong>
                <p style = {descriptionStyle}>Credits: {this.state.SpecificClassList[0]['Units']}</p>
            </div>

            displayed_scroller = 
            <InfiniteScroll
            dataLength={this.state.FilteredClassList.length}
            hasMore={false}
            height={270}
            >
            {this.state.FilteredClassList.map((item, index) => (
                <div style = {scrollerboxes} key = {index} value = {item}>
                    <Button fullWidth variant="outlined" size="large" id={item['Catalog Nbr']} onClick = {this.handleClick}>
                        {this.state.CurrentSubj} {item['Catalog Nbr']}: {item['Course Title']}
                    </Button> 
                </div>
            ))}
            </InfiniteScroll>

            {/*checking to see if selected class is already in scheduled class to decide what to render*/}
            let already_in_scheduled = false;
            for (let i = 0; i < this.state.ScheduledClasses.length; ++i) {
                if (this.state.FullSelectedClass.includes(this.state.ScheduledClasses[i]['class'])){
                    already_in_scheduled = true;
                }
            }

            {/* if class is already in schedule, don't let user choose the class again/hide selector */}
            if (already_in_scheduled) {
                del_btn = 
                <div style={buttonStyle}>
                    <Button variant="contained" color="secondary" onClick={this.handleDel}>
                        Delete Class From to Schedule
                    </Button>
                </div>
            } 
            //otherwise, display the selector and let user add class to their schedule
            else {
                {/*if lecarray isn't empty, create an object to be displayed showing the options*/}
                if (this.state.LecArray !== undefined && this.state.LecArray.length !== 0) {
                    lecture_choices = 
                    <div>
                        <i style={spacingStyle}>Lectures (choose at least one):</i>
                        <Select
                            value={this.state.SelectedLecs}
                            defaltValue={this.state.SelectedLecs}
                            options={this.state.LecDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a lecture(s)"
                            name="lecs"
                            isMulti
                        />
                    </div>
                } if (this.state.DiscArray !== undefined && this.state.DiscArray.length !== 0) {
                    disc_choices = 
                    <div>
                        <i style={spacingStyle}>Discussions (choose at least one):</i>
                        <Select
                            value={this.state.SelectedDiscs}
                            defaultValue={this.state.SelectedDiscs}
                            options={this.state.DiscDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a discussion(s)"
                            name="disc"
                            isMulti
                        />
                    </div>
                } if (this.state.LabArray !== undefined && this.state.LabArray.length !== 0) {
                    lab_choices = 
                    <div>
                        <i style={spacingStyle}>Labs (choose at least one):</i>
                        <Select
                            value={this.state.SelectedLabs}
                            defaultValue={this.state.SelectedLabs}
                            options={this.state.LabDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a lab(s)"
                            name="lab"
                            isMulti
                        />
                    </div>
                } if (this.state.SemArray !== undefined && this.state.SemArray.length !== 0) {
                    sem_choices = 
                    <div>
                        <i style={spacingStyle}>Seminars (choose at least one):</i>
                        <Select
                            value={this.state.SelectedSems}
                            defaultValue={this.state.SelectedSems}
                            options={this.state.SemDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a seminar(s)"
                            name="sem"
                            isMulti
                        />
                    </div>
                }
                if (this.state.RecArray !== undefined && this.state.RecArray.length !== 0) {
                    rec_choices = 
                    <div>
                        <i style={spacingStyle}>Recitations (choose at least one):</i>
                        <Select
                            value={this.state.SelectedRecs}
                            defaultValue={this.state.SelectedRecs}
                            options={this.state.RecDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a recitation(s)"
                            name="rec"
                            isMulti
                        />
                    </div>
                }
                add_rm_buttons = 
                    <div style={buttonStyle}>
                        <Button variant="contained" color="primary" onClick={this.handleAdd}>
                            Add Sections to Schedule
                        </Button>
                    </div>
                }
        }

        return (
            <div>
                <div className = "left-div">
                    {/* SEARCH FOR CLASS */}
                    <h3 style={{textAlign:'center'}}>umich scheduler</h3>
                    <form onSubmit={this.handleSubmit}>
                        <label>
                            Search for a subject:
                            <input type="text" value={this.state.value} onChange={this.handleChange} />
                        </label>
                        <input type="submit" value="Submit" />
                    </form>
                    
                    {/*HEADER FOR SCROLLER*/}
                    <hr/>
                    
                    {/* SCROLLER ITSELF*/}
                    {back_btn}
                    {displayed_scroller}

                    <hr/>
                    {/* BUTTONS FOR ADDING OR REMOVING A CLASS*/}
                    {class_header}
                    {lecture_choices}
                    {disc_choices}
                    {lab_choices}
                    {sem_choices}
                    {rec_choices}
                    {add_rm_buttons}
                    {del_btn}
                </div>
                <div className = "right-div">
                    <TestCal
                    selectedIntervals={this.state.selectedIntervals}/>
                    {nextprev}
                </div>
            </div>
        );
    }
}