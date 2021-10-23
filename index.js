//TODO: Maybe add option to restrict timetable to certain times per day / Add option to remove lessons from generated timetable
//TODO: Add / calculate hour count (individual + presence)

let events = [];
const weekdays = new Array("Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag")


const lessonsArray = new Array;

function populate(){
    for(let lesson of lessonsArray){
        if(lessons[lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] == ""){
            lessons[lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] = `${lesson.subject} ${lesson.teacher}`; //TODO: put module name instead of subject
        }
        else{
            console.log(`row ${lesson.timetableindex} on ${lesson.weekday} already populated`)
        }
    }
}

const Scheme = [[[17,10],[17,55]] , [[17,55],[18,40]] , [[18,45],[19,30]] , [[19,30],[20,15]] , [[20,25],[21,10]] , [[21,10],[21,55]]]

//returns the rowindex used for pushing into the timetable
function getTimeTableIndex(starttime,endtime){
    for(var x in Scheme){
        
        if(starttime.getHours() >= Scheme[x][0][0] && starttime.getMinutes() >= Scheme[x][0][1])
        {
            if( ((endtime.getHours() * 60 ) + endtime.getMinutes()) <= ((Scheme[x][1][0]*60) + Scheme[x][1][1])) //TODO: Check if working correctly - don't check for hours and mins individually, won't work if endtime < specified scheme endtime
            {
                //console.log(`Index: ${x}`)
                return x
            }
        }
    }
    console.warn("Lesson not in specified scheme.")
}


class lesson{
    constructor(subject, starttime, endtime, weekday, teacher){
        this.subject = subject;
        this.starttime = starttime;
        this.endtime = endtime;
        this.weekday = weekday;
        this.teacher = teacher;
        this.timetableindex = getTimeTableIndex(starttime,endtime)
        
        //FIXME: will only work for lessons which are in one "session" (remote)
    }

    // FieldAvailability(timetable){
        
    // }
}

function generateLessonArray(){ //TODO: join same subject lessons together
    for(let index in events){
        let starttime = new Date(events[index][1][1][3]);
        let endtime = new Date(events[index][1][2][3]);
        let duration = Math.round((((endtime-starttime) % 86400000) % 3600000) / 60000); // in mins
        //splitting to get subject from modulename
        let subject = events[index][1][4][3].split(" ").at(-1); // [-1] -> last element in array
        let weekday = weekdays[starttime.getDay()];
        let teacher = events[index][1][5][3];
        //TODO: save Semester (for population & subject "merging") -- Only use .ics "Semester" not modulename semester
        //TODO: Use ical.js functionality instead of indexing to array values
  
      //TODO: add semester to checkbox table
      console.log(`${weekday} ${duration}min ${subject} ${teacher}`)
      //TODO: Check if lesson already in lessonsarray
      

      lessonsArray.push(new lesson(subject,starttime,endtime,weekday,teacher));
    }
}

var reader = new FileReader();
reader.onload = function(event){
    var iCalendarData = reader.result;
    var jcalData = ICAL.parse(iCalendarData);
    
    //console.log(jcalData)
    events = jcalData[2];
    //console.log(events)

    generateLessonArray()
    //console.log(lessonsArray)
    RenderCheckboxes()

    populate() //TODO: move to right location
    ReactDOM.render(time_table, document.getElementById("timetable")); //FIXME: reading ics will be ASYNC
}

fetch('./data/5P.ics') //TODO: Load from github (zip?)
.then(res => res.blob())
.then(blob => reader.readAsText(blob), function(val){console.log("val.result")})


//TODO: Parse ics -> separate 1h and 1h+ lessons? (less checks) -> check [row][day] -> populate -> check -> populate -> ... -> exit


function Mytable(props){
    const items = [];
    items["headings"] = new Array;
    items["rows"] = new Array;
    const colCount = props.headings.length //FIXME: seems odd -> throwing error if headings.length > rowCount (should be if row lesson amount (lesson[rowindex].length) < headings.length) (introduce new variable?)
    const rowCount = Object.keys(lessons).length
    //console.log(colCount)


    items["headings"].push(<th>Stunde</th>) //Description of y-axis (leave empty?)

    for(let heading of props.headings){
        items["headings"].push(<th>{heading}</th>)  //add column title
    }
    
    for(let row=0; row<rowCount; row++){
        items["rows"][row] = new Array; //new array => new row 
        items["rows"][row].push(<td id="rowInfo">{row+1}.Stunde</td>)
    }

    let dataError = false;

    for(let row=0; row<rowCount; row++){
        for(let column=0; column < colCount; column++){
            console.log(lessons[row])
            console.log(lessons[row][column])
            
            if(lessons[row] == undefined || lessons[row][column] == undefined){
                dataError = true;
                continue
            }

            if(lessons[row][column] != "" && lessons[row][column] !== undefined){ //TODO: Check if !== undefined is working as expected and if a missing entry in "lesson rows" disrupts "authenticity"
                //console.log(lessons[column][row])
                items["rows"][row].push(<td id="lesson">{lessons[row][column]}</td>) //Iterating over lessons (Mon 1h -> Tue 1h -> ... -> Mon 2h -> ..)
            }
            else{
                items["rows"][row].push(<td id="empty">{lessons[row][column]}</td>) //adding another id (cell styling)
            }
        }
    }

    if(dataError){
        alert("Die Daten welche zur Erstellung des Stundenplans verwendet werden sind fehlerhaft.\nDie Ausgabe könnte Fehler enthalten.")
    }
    
    var tableData = items["rows"].map(function(obj) {
        return <tr>{obj}</tr>
    }
)

  return (
        <React.Fragment>
        <thead>
            <tr>
                {items["headings"]}
            </tr>
        </thead>
        <tbody>
                {tableData}
        </tbody>
        </React.Fragment>
  )
}

//FIXME: use lesson objects
function Checkboxtable(props){
    const rows = [];

    const maxSemesterCount = {
        //Loop over object array and find object with most semesters - used for generating (=row count)
    }

    rows["headings"] = new Array();

    rows["headings"].push(<th>Semester</th>);

    for(let subject of props.subjects){
        rows["headings"].push(<th>{subject}</th>)
        //console.log("push")
    }
    
    rows["rows"] = new Array()
    //console.log(props.subjects)
    //for(let row in ) //TODO: max array length (max Semester count)
    for(let x=0;x<8;x++){ //TODO: replace x with ^^^^^ && Check if column should include a checkbox or not
        rows["rows"][x] = new Array();
        rows["rows"][x].push(<td className="has-text-centered">{x+1}</td>)
        for(let subject of props.subjects){
            rows["rows"][x].push(<td className="has-text-centered"><label className="checkbox"><input type="checkbox"/></label></td>)
            //FIXME: add col index (?) - add id= to get checkbox state
        }
    }
    //TODO: Push Semester Counter 
    


    var tableData = rows["rows"].map(function(obj) {
        return <tr>{obj}</tr>
        }
    )
    //TODO: Get Semester of specific subject, ignore fully checked rows (=Semesterfile - when populating)

    //for(subject.)

    return (
        <React.Fragment>
        <thead>
            <tr>
                {rows["headings"]}
            </tr>
        </thead>
        <tbody>
                {tableData}
        </tbody>
        </React.Fragment>
        //TODO: Add timestamp "age" of .ics files
  )
}

var Days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
//var lessons = {'0':["A","L","GWK","GSP",""],'1':["B","D","L","GWK","GSP"],'2':["C","D","","GWK","GSP"],'3':["D","D","L","GWK",""],'4':["E","D","L","GWK",""],'5':["E","D","L","GWK","X"]}; // '0' Array -> 1. row
var lessons = {'0':["","","","",""], '1':["","","","",""], '2':["","","","",""], '3':["","","","",""], '4':["","","","",""], '5':["","","","",""]}
const time_table = <Mytable headings={Days} lessons={lessons}/>;



function RenderCheckboxes(){
    var allSubjects = new Set()

    for(let lesson of lessonsArray){
    allSubjects.add(lesson.subject) //TODO: R - blocked lessons?
        //console.log(lesson.subject)
    }
    console.log(allSubjects)
    //TODO: use dictionary and store checkbox positions (row indices) in array
    //TODO: check state of checkboxes http://jsfiddle.net/dY372/
    const checkbox_table = <Checkboxtable subjects={allSubjects}/>;
    ReactDOM.render(checkbox_table, document.getElementById("checkboxtable"));
}