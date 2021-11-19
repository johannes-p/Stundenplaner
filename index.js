//TODO: Maybe add option to restrict timetable to certain times per day
//TODO: Add / calculate hour count (individual + presence)

//TODO: if full hour make cell span 2 rows


//FIXME: pressing populate a second time after removing lessons is broken
//Does it cycle through valid options? only cycling on wednesday 1h - no

//TODO: if module not bookable, ignore all following modules of same type (beware of same subjects with different endings p,s,..)

//TODO: restrict to checkboxtable!! add checkbox id to ignoreAP
//TODO: after populating check if row = row + 1 (/row = row-1) (only on even numbers) -> rowspan 2 and remove entry on row+1
//FIXME: SEMESTERS - Module Name ->> Count modules

let events = []; //calendar events
const weekdays = new Array("Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag")

const lessonsArray = new Array;

var files = ["./data/1S.ics","./data/1P.ics","./data/2S.ics","./data/3P.ics","./data/4S.ics","./data/5S.ics","./data/5P.ics","./data/6S.ics","./data/7S.ics","./data/7P.ics","./data/8S.ics"] // aufsteigend

//invert files array
files = files.reverse()

var ignoreAP = new Set(); //"already populated"

function addCheckboxtoAP(){
    ignoreAP.clear()
    var idSelector = function() { return this.id; };
    var dontPopulate = $(":checkbox:checked").map(idSelector).get();
    //TODO: remove all checkbox ids from outside of checkbox table
    dontPopulate.forEach(ignoreAP.add, ignoreAP); //???
}

function populate(){
    //TODO: clear table
    // lessonsArray.shift() // removing empty slot FIXME: Not sure if necessary
    //TODO: Check if all lessons of subject fit, otherwise remove all lessons of that type
    // --> Check if lesson-teacher -> lesson count --> loop over lessons and count, maybe keep indices to remove the other lessons if they don't fit
    //TODO: Maybe add Option to allow/disable double "booking" (2 Semesters of one subject at once)
    let lesson;
    addCheckboxtoAP()
    for(let semester in lessonsArray){
        //check if lessonsArray[semester] empty
        if(lessonsArray[semester].length == 0){ //FIXME: if continue -> code breaks
            //continue;
        }
        for(let subjectindex in lessonsArray[semester]){
            
            for(lesson of lessonsArray[semester][subjectindex]){
                let index = lessonsArray[semester][subjectindex].indexOf(lesson) + 1;
                let lessonCount = lessonsArray[semester][subjectindex].length;

                if(!ignoreAP.has(lesson.module_name.slice(0,-1))){
                    //FIXME: - if not in specified scheme:
                    if(lesson.timetableindex == undefined){
                        break
                    }
                    
                    console.log(`trying to populate  ${lesson.module_name} ${index}/${lessonCount}`)
                    if(lessons[lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] == ""){
                        lessons[lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] = `${lesson.module_name} ${lesson.teacher}`;
                        
                        console.log(lesson.duration)
                        if(lesson.duration == 45){
                            if(lessons[lesson.timetableindex+1][weekdays.indexOf(lesson.weekday)-1] == ""){
                                lessons[lesson.timetableindex+1][weekdays.indexOf(lesson.weekday)-1] = `${lesson.module_name} ${lesson.teacher}`;
                            }
                            //FIXME: REMOVE if this doesnt work ^^^^
                        }


                        //add modulename to lessons
                        //FIXME: take care, if modulename of L and F is changed jquery can't remove it
                        //TODO: Add Checkbox to select either L or F and check which one needs to be added
                        
                        if(index == lessonCount){
                            ignoreAP.add(lesson.module_name.slice(0,-1))
                            console.log("lesson added..")
                            console.log(ignoreAP)
                        }
                    }
                    else{
                        //complete subject doesn't fit in timetable
                        //remove all of "lesson" from timetable

                        for(let rows in lessons){
                            for(let col in lessons[rows]){
                                if(lessons[rows][col] == `${lesson.module_name} ${lesson.teacher}`){
                                    console.log("removing " + col)
                                    lessons[rows][col] = "";
                                }
                            }
                        }

                        console.log(`row ${lesson.timetableindex} on ${lesson.weekday} already populated`)
                        break //leave loop to ignore remaining lessons of this module
                    }
                } else {
                    console.log(`skipping ${lesson.module_name} - ${lesson.module_name.slice(0,-1)} Module already populated`)
                    break //FIXME: Maybe does nothing?
                }
            }
        }
    }
    time_table = <Mytable headings={Days} lessons={lessons}/>;
    ReactDOM.render(time_table, document.getElementById("timetable"));
}

// const Scheme = [[[17,10],[17,55]] , [[17,55],[18,40]] , [[18,45],[19,30]] , [[19,30],[20,15]] , [[20,25],[21,10]] , [[21,10],[21,55]]]
// const Scheme2 = [[[17,10],[17,32]] , [[17,32],[17,55]] , [[17,55],[18,17]] , [[18,17],[18,40]] , [[18,45],[19,7]] , [[19,7],[19,30]] , [[19,30],[0,0]] , [[20,25],[20,47]] , [[20,47],[21,10]]]

const FullHourScheme = [["17:10","17:55"] , ["17:55","18:40"] , ["18:45","19:30"] , ["19:30","20:15"] , ["20:25","21:10"] , ["21:10","21:55"]]  //TODO: VVV
const HalfHourScheme = [["17:10","17:32"] , ["17:32","17:55"] , ["17:55","18:17"] , ["18:17","18:40"] , ["18:45","19:07"] , ["19:07","19:30"] , ["19:30","19:52"] , ["19:52","20:15"] , ["20:25","20:47"] , ["20:47","21:10"] , ["21:10","21:32"] , ["21:32","21:55"]]

function getTimeTableIndex(starttime,endtime){
    let starttimeString = starttime.getHours() + ":" + starttime.getMinutes()
    let endtimeString = endtime.getHours() + ":" + endtime.getMinutes()

    //console.log(`starttime: ${starttimeString} endtime: ${endtimeString}`)

    for(var x in HalfHourScheme){
        if(starttimeString >= HalfHourScheme[x][0])
        {
            if( endtimeString <= HalfHourScheme[x][1])
            {
                //console.log("This is a halfhour lesson!")
                //console.log(`Index: ${x}`)
                return x
            }
        }
    }

    for(var x in FullHourScheme){
        if(starttimeString >= FullHourScheme[x][0])
        {
            if( endtimeString <= FullHourScheme[x][1]) //TODO: Check if working correctly - don't check for hours and mins individually, won't work if endtime < specified scheme endtime
            {
                //console.log(`Index: ${x}`)
                //TODO: Cell span 2
                //FIXME: This will break stuff
                
                //TODO: set the full hour (both halfhour cells) (x*2) and (x*2)+1
                return x*2
            }
        }
    }
}

//use jquery to get right clicked element
$(document).ready(function(){
    $(document).on("click", "#lesson", function(event){
        if(event.which == 1){ //TODO: right click not working (3)
            var cell = $(this);

            console.log(cell.text());  
            //get all elements with this text
            var elements = $(`td:contains(${cell.text()})`);
            //remove text of all elements
            elements.each(function(){
            $(this).text("");
            $(this).removeAttr("id"); //remove id (lesson) -> styling
        });  
        }
    });
});

/**returns the rowindex of the passed timespan which is used to push the lesson into the timetable*/
// function getTimeTableIndex(starttime,endtime){
//     for(var x in Scheme){        
//         if(starttime.getHours() >= Scheme[x][0][0] && starttime.getMinutes() >= Scheme[x][0][1])
//         {
//             if( ((endtime.getHours() * 60 ) + endtime.getMinutes()) <= ((Scheme[x][1][0]*60) + Scheme[x][1][1])) //TODO: Check if working correctly - don't check for hours and mins individually, won't work if endtime < specified scheme endtime
//             {
//                 //console.log(`Index: ${x}`)
//                 return x
//             }
//         }
//     }
//     alert("Stundendaten fehlerhaft!")
//     console.warn("Lesson not in specified scheme.")
// }

function generateLessonArray(filename){ //TODO: join same subject lessons together
    // if(events.length == 0){
    //     //alert("Keine Stunden gefunden!")
    //     let semester_and_moduletype = filename.split("/")[filename.split("/").length - 1].split(".")[0] // filename.split.length equal -1 (last element of array)
    //     let semester = semester_and_moduletype.charAt(0)
    //     lessonsArray[semester] = new Array()
    //     return
    // }

    for(let index in events){
        let starttime = new Date(events[index][1][1][3]);
        let endtime = new Date(events[index][1][2][3]);
        let duration = Math.round((((endtime-starttime) % 86400000) % 3600000) / 60000); // in mins
        let subject = events[index][1][4][3].split(" ").at(-1); // [-1] -> last element in array (getting subject from modulename)
        let weekday = weekdays[starttime.getDay()];
        let teacher = events[index][1][5][3];
        //TODO: Use ical.js functionality instead of indexing to array values
        
        
        let semester_and_moduletype = filename.split("/")[filename.split("/").length - 1].split(".")[0] // filename.split.length equal -1 (last element of array)
        let semester = semester_and_moduletype.charAt(0) 
        //Check if subject is "L" or "F" in these cases semester[0] - 1  (only when populating timetable - not for the checkbox table)
        //Needed to compensate for Semestercount in formular (Webuntis -> Semester 2, formular Semester 1)
        
        let module_name = subject + semester_and_moduletype;
        
        //TODO: add semester to checkbox table
        //console.log(`${weekday} ${duration}min ${subject} ${teacher}`)
        
        if(lessonsArray[semester] == undefined){
            lessonsArray[semester] = new Array;
        }

        //check if lessonsArray has key module_name
        if(lessonsArray[semester][module_name] == undefined){
            lessonsArray[semester][module_name] = new Array;
        }

        if(subject != undefined && starttime != undefined && endtime != undefined && weekday != undefined && teacher != undefined && module_name != undefined){
            lessonsArray[semester][module_name].push(new lesson(subject, starttime, endtime, weekday, teacher, module_name, duration));
        } else {
            console.warn("something went wrong")
        }
        //FIXME: if subject already booked ignore same subjects with other module_type!!!!
        //TODO: ^^^^ in populate

        console.log(lessonsArray)
        //lessonsArray.push(new lesson(subject,starttime,endtime,weekday,teacher));
    }

}

var reader = new FileReader();
const fetchFiles = (iterator) => {

    if (iterator >= 0)
    {
        fetch(files[iterator])
        .then(res => res.blob())
        .then(blob => {
            reader.readAsText(blob);

            reader.onload = function(e) {
                // The file's text will be printed here
                //console.log(e.target.result)
                
                var iCalendarData = reader.result;
                var jcalData = ICAL.parse(iCalendarData);
                    
                events = jcalData[2];

                generateLessonArray(files[iterator]) //TODO: pass semester - split from filename
                

                //console.log(`populating using ${files[iterator]}`)
                //populate()
                ReactDOM.render(time_table, document.getElementById("timetable"));
                
                fetchFiles(iterator-1);
              };

        })
    } else { //
        RenderCheckboxes() //FIXME: -> RenderCheckbox Function
    } //
}

fetchFiles(files.length-1)    //load all files


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
        if(row%2 == 0){
             
            items["rows"][row].push(<td id="rowInfo" rowspan ="2">{(row/2)+1}.Stunde</td>) //FIXME: added rowspan - remove if not working
        }
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
            //TODO: Check if lessons[row-1][col] has rowspan2 in that case "continue"
            if(lessons[row][column] != "" && lessons[row][column] !== undefined){ //TODO: Check if !== undefined is working as expected and if a missing entry in "lesson rows" disrupts "authenticity"
                //console.log(lessons[column][row])
                console.log("not empty")
                items["rows"][row].push(<td id="lesson">{lessons[row][column]}</td>) //Iterating over lessons (Mon 1h -> Tue 1h -> ... -> Mon 2h -> ..)
            }
            else{
                console.log("empty")
                items["rows"][row].push(<td id="empty">{lessons[row][column]}</td>) //adding another id (cell styling)
            }
        }
    }

    if(dataError){
        alert("Stundenplan fehlerhaft!")
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

    const SemesterCount = props.boxPositions.length;

    rows["headings"] = new Array();

    rows["headings"].push(<th>Semester</th>);

    for(let subject of props.subjects){
        rows["headings"].push(<th>{subject}</th>)
        //console.log("push")
    }
    
    rows["rows"] = new Array()
    //console.log(props.subjects)
    //for(let row in ) //TODO: max array length (max Semester count)
    for(let x=0;x<SemesterCount;x++){ //TODO: replace x with ^^^^^ && Check if column should include a checkbox or not
        rows["rows"][x] = new Array();
        rows["rows"][x].push(<td className="has-text-centered">{x+1}</td>)
        
        for(let subject of props.subjects){
            if(props.boxPositions[x].has((subject + (x+1)))){ //FIXME: This won't work if Semesterfiles are missing (x index not taking into account present files) 3P, 5P, 2S -> still searching for M1, M2, M3 etc.
                rows["rows"][x].push(<td className="has-text-centered"><label className="checkbox"><input type="checkbox" id={subject + (x+1)}/></label></td>)
            } else {
                rows["rows"][x].push(<td className="has-text-centered" id="emptyField"></td>)
            }
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
var lessons = {'0':["","","","",""], '1':["","","","",""], '2':["","","","",""], '3':["","","","",""], '4':["","","","",""], '5':["","","","",""], '6':["","","","",""], '7':["","","","",""], '8':["","","","",""], '9':["","","","",""], '10':["","","","",""], '11':["","","","",""]}
var time_table = <Mytable headings={Days} lessons={lessons}/>;



function RenderCheckboxes(){
    var subjectHeadings = new Set()
    let CheckboxArray = new Array()

    for(let semester in lessonsArray){
        CheckboxArray[semester] = new Set()
        for(let subject in lessonsArray[semester]){
            subjectHeadings.add(subject.slice(0, -2))
            CheckboxArray[semester].add(subject.slice(0, -1)) //used for checkbox placement
        }
    }
    
    CheckboxArray = CheckboxArray.flat() //Remove empty slots from Array

    // for(let lesson of lessonsArray){
    // allSubjects.add(lesson.subject) //TODO: R - blocked lessons?
    //     //console.log(lesson.subject)
    // }
    console.log(subjectHeadings)
    //TODO: use dictionary and store checkbox positions (row indices) in array
    //TODO: check state of checkboxes http://jsfiddle.net/dY372/
    const checkbox_table = <Checkboxtable subjects={subjectHeadings} boxPositions={CheckboxArray}/>;
    ReactDOM.render(checkbox_table, document.getElementById("checkboxtable"));
    //CheckboxArray.length = 0;
}
