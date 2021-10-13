
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
    const colCount = props.headings.length
    const rowCount = Object.keys(lessons).length
    console.log(colCount)


    items["headings"].push(<th>Stunde</th>) //Description of y-axis (leave empty?)

    for(let heading of props.headings){
        items["headings"].push(<th>{heading}</th>)  //add column title
    }
    
    for(let row=0; row<rowCount; row++){
        items["rows"][row] = new Array; //new array => new row 
        items["rows"][row].push(<td id="rowInfo">{row+1}.Stunde</td>)
    }

    let dataError = false;

    for(let row=0; row<rowCount; row++){ //Generate Array for row //FIXME: switched row and column? -> expected output, wrong variable assignment
        for(let column=0; column < colCount; column++){
            if(lessons[column][row] !== undefined){
                dataError = true;
            }

            if(lessons[column][row] != "" && lessons[column][row] !== undefined){ //TODO: Check if !== undefined is working as expected and if a missing entry in "lesson rows" disrupts "authenticity"
                console.log(lessons[column][row])
                items["rows"][column].push(<td id="lesson">{lessons[column][row]}</td>) //Iterating over lessons (Mon 1h -> Tue 1h -> ... -> Mon 2h -> ..)
            }
            else{
                items["rows"][column].push(<td id="empty">{lessons[column][row]}</td>) //adding another id (cell styling)
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

var Days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
var lessons = {'0':["A","","","L","GWK","GSP"],'1':["B","D","L","GWK","GSP"],'2':["C","D","","GWK","GSP"],'3':["D","D","L","GWK",""],'4':["E","D","L","GWK",""], '5':["E","F","G","",""]}; // '1' Array -> 1. row
const time_table = <Mytable headings={Days} lessons={lessons}/>;

ReactDOM.render(time_table, document.getElementById("timetable"));