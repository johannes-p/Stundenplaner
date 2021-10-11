
// var reader = new FileReader();
// reader.onload = function(event){
//   var iCalendarData = reader.result;
//   var jcalData = ICAL.parse(iCalendarData);
  
//   console.log(jcalData)
// }

// fetch('./data/5P.ics') //TODO: Load from github (zip?)
// .then(res => res.blob())
// .then(blob => reader.readAsText(blob), function(val){console.log("val.result")})


//TODO: Parse ics -> separate 1h and 1h+ lessons? (less checks) -> check [row][day] -> populate -> check -> populate -> ... -> exit


function Mytable(props){
    const items = [];
    items["headings"] = new Array;
    items["rows"] = new Array;
    const rowcount = props.lessons['0'].length //set max row amount (all rows need to have the same amount of cols!)
    items["headings"].push(<th>Stunde</th>) //Description of y-axis (leave empty?)

    for(let heading of props.headings){
        items["headings"].push(<th>{heading}</th>)
    }
    
    for(let row=0; row<rowcount; row++){
        items["rows"][row] = new Array;
        items["rows"][row].push(<td id="rowInfo">{row+1}.Stunde</td>)
    }

    for(let day in props.headings){ //Generate Array for row
        for(let rowindex=0; rowindex < rowcount; rowindex++){
            if(lessons[rowindex][day] != ""){
                items["rows"][rowindex].push(<td id="lesson">{lessons[rowindex][day]}</td>) //Iterating over lessons (Mon 1h -> Tue 1h -> ... -> Mon 2h -> ..)
            }
            else{
                items["rows"][rowindex].push(<td id="empty">{lessons[rowindex][day]}</td>) //adding another id (cell styling)
            }
            
        }
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

// var Days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
// var lessons = {'0':["A","D","L","GWK","GSP"],'1':["B","D","L","GWK","GSP"],'2':["C","D","L","GWK","GSP"],'3':["D","D","L","GWK","GSP"],'4':["E","D","L","GWK","GSP"]}; // '1' Array -> 1. row
// const time_table = <Mytable headings={Days} lessons={lessons}/>;

// ReactDOM.render(time_table, document.getElementById("timetable"));