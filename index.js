const weekdays = new Array("Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag")

let lessonsArray = new Array;

//DAZ2 (- 2 is not the index) (Freifach?) SWa SWb ??? "Darstellendes Spiel"
var unsupportedSubjects = ["R","Eth","ÖKO","DAZ1","DAZ2","PBLT"] //ÖKO unsupported - no way of telling which module is 1 / 2 TODO: complete list

var ignoreAP = new Set(); //"already populated"
var ignoreCheckboxes = new Set();
var rejectedModules = new Set();

var alertModules =  ["LPK1A","LPK1B"] //modules where special rules apply TODO:

var moduleCountDict = {}
var doublebooking = false
var studium = "";
var selectedWeek = "A";

function hideAllIgnoredSubjects(column){
    var all_cols=document.getElementsByClassName(column)
    
    all_cols.forEach(function(col){
        col.style.display="none"
        }
    )
}

/** determines the module counter of a subject in the given semester */
function getModuleCounter(subject, semester){
 
    if(moduleCountDict[semester] == undefined){
        moduleCountDict[semester] = {}
    }

    if(moduleCountDict[semester][subject] != undefined){
        return moduleCountDict[semester][subject]
    } else {
        for(let s=Object.keys(moduleCountDict).length; s >= 0; s--){
            try{
                if(moduleCountDict[s][subject] != undefined){
                    moduleCountDict[semester][subject] = moduleCountDict[s][subject] + 1
                    return moduleCountDict[semester][subject]
                }
            }
            catch(e){
                //console.log(e)
                continue
            }
        }
        moduleCountDict[semester][subject] = 1;
        return 1
    }
    
}

function setSemesterStamp(file){
    var stamp;

    new Promise(function(resolve, reject){
            //fetch
            fetch(file)
            //get last modified date
            .then(response => response.headers.get("Last-Modified"))
            //parse date
            .then(date => new Date(date))
            //get if date is in winter or summer
            .then(date => { //FIXME: dependent on download date 
                if(date.getMonth() >= 8 || date.getMonth() <= 2){
                    stamp = "Wintersemester"
                } else {
                    stamp = "Sommersemester"
                }

                stamp += " " + date.getFullYear()
                resolve()
            })
        }).then(function(){
        document.getElementById("semesterStamp").innerHTML = stamp
    })   
}


function getModuleType(semester_and_moduletype) {
    let presence = ["a", "b", "c", "d", "e", "f"]
    let remote = ["s", "t", "u", "p", "q", "r"]
    let type = semester_and_moduletype.charAt(1).toLowerCase()

    //if type is in presence
    if(presence.includes(type)){
        return "presence"
    }
    //if type is in remote
    else if(remote.includes(type)){
        return "remote"
    }
    //if type is not in presence or remote
    else{
        console.error("unknown moduletype")
        // throw error?
        return "unsupported"
    }
}


function addCheckboxtoIgnoreArray(){
    var idSelector = function() { return this.id; };
    var dontPopulate = $(":checkbox:checked").map(idSelector).get();
    dontPopulate.forEach(ignoreCheckboxes.add, ignoreCheckboxes);
}

function isEarlierSubjectBooked(lesson){ //FIXME: the subject two semesters earlier allows the user to book this subject
    //get index of module
    let index = lesson.module_name.charAt(lesson.module_name.length-2)
    
    //check if index is a number
    if(isNaN(index)){
        console.error("index is not a number")
        //FIXME:
        return false
    }
    
    let lastIndex = index - 1
    if(lastIndex == 0){
        //on first occurance of module (no earlier module)
        return true
    }

    let secondToLastIndex = lastIndex - 1

    if(secondToLastIndex == 0){
        return true
        //second module
        // FIXME: can the second module be booked if the first one wasn't booked/attended? - remove this block if not
    }

    let secondToLastModule = lesson.module_name.slice(0, -2) + secondToLastIndex
    let lastModule = lesson.module_name.slice(0, -2) + lastIndex

    console.log(lastModule + " trying to populate " + lesson.module_name_teacher)

    // if last or second to last module was attended or is booked
    if(ignoreAP.has(lastModule) || ignoreCheckboxes.has(lastModule) || ignoreAP.has(secondToLastModule) || ignoreCheckboxes.has(secondToLastModule)){
        return true
    } else {
        return false
    }
}


function bookable(lesson){
    if(!isEarlierSubjectBooked(lesson)){
        console.warn(`earlier modules of ${lesson.module_name} not attended/booked - skipping`) //FIXME: maybe print subject + counter instead of module_name
        return false
    }

    // D8 / E8 / M8 - only book if attended module in 7. Semester //TODO: check if this is correct 
    if(lesson.module_name.slice(0, -2) == "D" || lesson.module_name.slice(0, -2) == "E" || lesson.module_name.slice(0, -2) == "M"){
        if(lesson.module_name.charAt(lesson.module_name.length-2) == "8"){
            if(!ignoreCheckboxes.has(lesson.module_name.slice(0, -2) + "7")){
                console.warn(`${lesson.module_name.slice(0, -2)} not attended in 7. Semester - skipping`)
                return false
            }
        }
    }
    


    //TODO:

    return true

}

const getTimetableValues = (obj) => (obj && typeof obj === 'object')
 ? Object.values(obj).map(getTimetableValues).flat()
 : [obj]

function populate(){
    if(studium == ""){
        alert("Bitte Studium auswählen")
        return
    }

    disableInputs(); //TODO: don't disable studium select (for mixed booking)

    let lesson;
    addCheckboxtoIgnoreArray();
    for(let semester in lessonsArray){
        console.log(lessonsArray)

        for(let subjectkey in lessonsArray[semester]['A']){ // LOOP for subjects existing in A and B

        lessonloop:            
            for(lesson of lessonsArray[semester]['A'][subjectkey]){
                if(unsupportedSubjects.includes(lesson.module_name.slice(0, -2))){
                    console.warn(`${lesson.module_name} is ignored`)
                    break
                }

                if(!bookable(lesson)){
                    break
                }

                //if doublebooking is set to false and subject is already in ignoreAP, skip
                if(!doublebooking){
                    for(let subject of ignoreAP){
                        if(subject.slice(0,-1) == lesson.module_name.slice(0, -2)){
                            console.warn(`${lesson.module_name.slice(0, -2)} already booked once - doublebooking is disabled`)
                            break lessonloop
                        }
                    }
                }
                
                //check if lesson.moduleType matches studium
                if(lesson.moduleType != studium){
                    console.warn(`${lesson.module_name} is ignored - module study type does not match selected type`)
                    continue //stay in lessonloop - skip this lesson
                }

                let index = lessonsArray[semester]['A'][subjectkey].indexOf(lesson) + 1; // how many lessons of module have been checked already
                let lessonCount = lessonsArray[semester]['A'][subjectkey].length;       // total lessons remaining

                if(!ignoreAP.has(lesson.module_name.slice(0,-1)) && !ignoreCheckboxes.has(lesson.module_name.slice(0,-1)) ){ 
                    if(rejectedModules.has(lesson.module_name_teacher)){
                        console.warn(`${lesson.module_name_teacher} rejected earlier`)
                        continue //stay in lessonloop - skip this lesson
                    }
                    
                    if(lesson.timetableindex == undefined){
                        //This should not happen - if it does, either lesson-HourSchemes or the provided ics files are not correct
                        alert("Es ist ein Fehler aufgetreten.")
                        throw new Error("The timetableindex of lesson " + lesson.moduleAndteacher + " is undefined")
                    }
                    
                    console.log(`trying to populate  ${lesson.module_name} ${index}/${lessonCount}`)
                    if(timetableArray['A'][lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] == ""){

                        timetableArray['A'][lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] = `${lesson.module_name_teacher}`;
                        
                        console.log(lesson.duration)
                        if(lesson.duration == 45){
                            if(timetableArray['A'][lesson.timetableindex+1][weekdays.indexOf(lesson.weekday)-1] == ""){
                                timetableArray['A'][lesson.timetableindex+1][weekdays.indexOf(lesson.weekday)-1] = `${lesson.module_name_teacher}`;
                            } else {
                                //if 2nd half of lesson doesn't fit (2 half hour lessons)
                                removeLessons(lesson);
                                break
                            }
                        
                        }

                        //check if in both weeks
                        
                        if(lessonsArray[semester]['B'][subjectkey] != undefined){
                            console.log(`${lesson.module_name_teacher} is in week A and B`)
                            if(timetableArray['B'][lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] == ""){
                                timetableArray['B'][lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] = `${lesson.module_name_teacher}`;
                            
                                if(lesson.duration == 45){
                                    if(timetableArray['B'][lesson.timetableindex+1][weekdays.indexOf(lesson.weekday)-1] == ""){
                                        timetableArray['B'][lesson.timetableindex+1][weekdays.indexOf(lesson.weekday)-1] = `${lesson.module_name_teacher}`;
                                    } else {
                                        //if 2nd half of lesson doesn't fit (2 half hour lessons)
                                        removeLessons(lesson);
                                        break
                                    }
                                }
                            
                            } else {
                                console.warn("row already populated in week B")
                                removeLessons(lesson);
                                break
                            }
                        }
                        
                        if(index == lessonCount){
                            ignoreAP.add(lesson.module_name.slice(0,-1))
                            console.log("lesson added..")
                            console.log(ignoreAP)
                        }
                    }
                    else{
                        //complete subject doesn't fit in timetable - remove all of "lesson" from timetable
                        removeLessons(lesson);
                        break //leave loop to ignore remaining lessons of this module
                    }
                } else {
                    console.table(`skipping ${lesson.module_name} - already populated or attended`) //FIXME: table?
                    break
                }
            }
        }
    
    
    
    
        //TODO: LOOP FOR WEEK B
        
        for(let subjectkey in lessonsArray[semester]['B']){

            // break

            lessonloopB:            
                for(lesson of lessonsArray[semester]['B'][subjectkey]){
                    if(unsupportedSubjects.includes(lesson.module_name.slice(0, -2))){
                        console.warn(`${lesson.module_name} is ignored`)
                        break
                    }

                    if(!bookable(lesson)){
                        break
                    }

                    //if doublebooking is set to false and subject is already in ignoreAP, skip
                    if(!doublebooking){
                        for(let subject of ignoreAP){
                            if(subject.slice(0,-1) == lesson.module_name.slice(0, -2)){
                                console.warn(`${lesson.module_name.slice(0, -2)} already booked once - doublebooking is disabled`)
                                break lessonloopB
                            }
                        }
                    }
                    
                    //check if lesson.moduleType matches studium
                    if(lesson.moduleType != studium){
                        console.warn(`${lesson.module_name} is ignored - module study type does not match selected type`)
                        continue //stay in lessonloop - skip this lesson
                    }

                    let index = lessonsArray[semester]['B'][subjectkey].indexOf(lesson) + 1; // how many lessons of module have been checked already
                    let lessonCount = lessonsArray[semester]['B'][subjectkey].length;       // total lessons remaining

                    if(!ignoreAP.has(lesson.module_name.slice(0,-1)) && !ignoreCheckboxes.has(lesson.module_name.slice(0,-1)) ){ 
                        if(rejectedModules.has(lesson.module_name_teacher)){
                            console.warn(`${lesson.module_name_teacher} rejected earlier`)
                            continue //stay in lessonloop - skip this lesson
                        }
                        
                        if(lesson.timetableindex == undefined){
                            //This should not happen - if it does, either lesson-HourSchemes or the provided ics files are not correct
                            alert("Es ist ein Fehler aufgetreten.")
                            throw new Error("The timetableindex of lesson " + lesson.moduleAndteacher + " is undefined")
                        }
                        
                        console.log(`trying to populate  ${lesson.module_name} ${index}/${lessonCount}`)
                        if(timetableArray['B'][lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] == ""){

                            timetableArray['B'][lesson.timetableindex][weekdays.indexOf(lesson.weekday)-1] = `${lesson.module_name_teacher}`;
                            
                            console.log(lesson.duration)
                            if(lesson.duration == 45){
                                if(timetableArray['B'][lesson.timetableindex+1][weekdays.indexOf(lesson.weekday)-1] == ""){
                                    timetableArray['B'][lesson.timetableindex+1][weekdays.indexOf(lesson.weekday)-1] = `${lesson.module_name_teacher}`;
                                } else {
                                    //if 2nd half of lesson doesn't fit (2 half hour lessons)
                                    removeLessons(lesson);
                                    break
                                }
                            }

                            if(index == lessonCount){
                                ignoreAP.add(lesson.module_name.slice(0,-1))
                                console.log("lesson added..")
                                console.log(ignoreAP)
                            }

                        } else {
                            //complete subject doesn't fit in timetable - remove all of "lesson" from timetable
                            removeLessons(lesson);
                            break //leave loop to ignore remaining lessons of this module
                        }

                    } else {
                        console.table(`skipping ${lesson.module_name} - already populated or attended`) //FIXME: table?
                        break
                    }
                }
            }    
    
    }

    styleCheckboxtable()
    
    timetableComponent = <Mytable headings={Days} timetablelessons={timetableArray["A"]}/>;
    ReactDOM.render(timetableComponent, document.getElementById("timetableA"));
    timetableComponent = <Mytable headings={Days} timetablelessons={timetableArray["B"]}/>;
    ReactDOM.render(timetableComponent, document.getElementById("timetableB"));
    BookedListComponent = <BookedList moduleAndteacherSet={new Set(getTimetableValues(timetableArray))}/>;
    ReactDOM.render(BookedListComponent, document.getElementById("bookedList"));
}

function disableInputs() {
    $("input[type=checkbox]").each(function () {
        this.disabled = true;
    });

    $("select").each(function () {
        this.disabled = true;
    });
}

function removeLessons(lesson) {
    for(let week in timetableArray){
        for(let day in timetableArray[week]){
            for(let row in timetableArray[week][day]){
                if(timetableArray[week][day][row] == `${lesson.module_name_teacher}`){
                    timetableArray[week][day][row] = "";
                }
            }
        }
    }

    console.log(`row ${lesson.timetableindex + 1} on ${lesson.weekday} already populated`);
}

function styleCheckboxtable(){
    console.log(ignoreAP)
    ignoreAP.forEach(module => {
        $("#" + module).parent().parent().css("background-color", "rgb(41, 196, 165, 0.5)"); //FIXME: add to css instead?
    })
}

const FullHourScheme = [["17:10","17:55"] , ["17:55","18:40"] , ["18:45","19:30"] , ["19:30","20:15"] , ["20:25","21:10"] , ["21:10","21:55"]]
const HalfHourScheme = [["17:10","17:32"] , ["17:32","17:55"] , ["17:55","18:17"] , ["18:17","18:40"] , ["18:45","19:07"] , ["19:07","19:30"] , ["19:30","19:52"] , ["19:52","20:15"] , ["20:25","20:47"] , ["20:47","21:10"] , ["21:10","21:32"] , ["21:32","21:55"]]

function getTimeTableIndex(starttime,endtime){

    let starttimeString = ('0' + starttime.getHours()).slice(-2) + ":" + ('0' + starttime.getMinutes()).slice(-2)
    let endtimeString = ('0' + endtime.getHours()).slice(-2) + ":" + ('0' + endtime.getMinutes()).slice(-2)

    for(var x in HalfHourScheme){
        if(starttimeString >= HalfHourScheme[x][0])
        {
            if( endtimeString <= HalfHourScheme[x][1])
            {
                //This is a halfhour lesson!
                return x
            }
        }
    }

    for(var x in FullHourScheme){
        if(starttimeString >= FullHourScheme[x][0])
        {
            if( endtimeString <= FullHourScheme[x][1])
            {
                return x*2 //2 halfhour lessons per fullhour lesson
            }
        }
    }
}


//removing lessons from timetable using jquery to get right clicked element
$(document).ready(function(){
    $(document).on("click", ".lesson", function(event){
        if(event.which == 1){
            var cell = $(this);

            console.log(`removing ${cell.text()}`);
            
            //add cell.text() to rejectedModules
            rejectedModules.add(cell.text())
            
            // remove color from checkbox table cell
            let checkboxid = cell.text().split(" ")[0].slice(0,-1)
            $("#" + checkboxid).parent().parent().css("background-color", "white");

            //remove from both timetables TODO: check if this works with timetable B aswell
            for(let week in timetableArray){
                for(let day in timetableArray[week]){
                    for(let row in timetableArray[week][day]){
                        if(timetableArray[week][day][row] == cell.text()){
                            timetableArray[week][day][row] = "";
                        }
                    }
                }
            }

            //remove module from AP
            let module = cell.text().split(" ")[0].slice(0,-1)
            ignoreAP.delete(module)

            //update timetable
            timetableComponent = <Mytable headings={Days} timetablelessons={timetableArray["A"]}/>;
            ReactDOM.render(timetableComponent, document.getElementById("timetableA"));
            timetableComponent = <Mytable headings={Days} timetablelessons={timetableArray["B"]}/>;
            ReactDOM.render(timetableComponent, document.getElementById("timetableB"));
            BookedListComponent = <BookedList moduleAndteacherSet={new Set(getTimetableValues(timetableArray))}/>;
            ReactDOM.render(BookedListComponent, document.getElementById("bookedList"));
        }
    });
});

async function readJSON(filePath) {
    // fetch the file
    const response = await fetch(filePath);
  
    // read the file contents as text
    const jsonString = await response.text();
  
    // parse the JSON string into an object
    const data = JSON.parse(jsonString);
  
    return data;
}

readJSON('data/lessons.json').then(
    (data) => {
        lessonsArray = data;
        // console.log(timetableArray)
        doneReadingFiles()
    },
    (error) => {
      // this function is called if the Promise is rejected
      // error is the rejected value of the Promise, which is an Error object
    }
  );

function Mytable(props){
    const items = [];
    items["headings"] = new Array;
    items["rows"] = new Array;
    const colCount = props.headings.length //FIXME: seems odd -> throwing error if headings.length > rowCount (should be if row lesson amount (lesson[rowindex].length) < headings.length) (introduce new variable?)
    const rowCount = Object.keys(props.timetablelessons).length

    items["headings"].push(<th>Stunde</th>) //Description of y-axis (leave empty?)

    for(let heading of props.headings){
        items["headings"].push(<th>{heading}</th>)  //add column title
    }
    
    for(let row=0; row<rowCount; row++){ //hour counter
        items["rows"][row] = new Array; //new array => new row
        if(row%2 == 0){
            items["rows"][row].push(<td className="rowInfo" rowSpan ="2">{(row/2)}.Stunde</td>)
        }
    }

    for(let row=0; row<rowCount; row++){
        for(let column=0; column < colCount; column++){
            
            if(props.timetablelessons[row][column] != "" && props.timetablelessons[row][column] !== undefined){
                items["rows"][row].push(<td className="lesson text-center">{props.timetablelessons[row][column]}</td>) //Iterating over lessons (Mon 1h -> Tue 1h -> ... -> Mon 2h -> ..)
            }
            else{
                items["rows"][row].push(<td className="empty">{props.timetablelessons[row][column]}</td>) //adding another id (cell styling)
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

function BookedList(props){
    const items = [];
    items["modules"] = new Array();
    let modules = props.moduleAndteacherSet;

    if(modules == undefined){
        return (null)
    }

    for(let module of modules){
        if(module != ""){
            items["modules"].push(<li>{module}</li>)
        }    
    }
    console.log(items)
    return (
        <React.Fragment>
            {items["modules"]}
        </React.Fragment>
    )
}

const Days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
var timetableArray = {'A' : {'0':["","","","",""], '1':["","","","",""], '2':["","","","",""], '3':["","","","",""], '4':["","","","",""], '5':["","","","",""], '6':["","","","",""], '7':["","","","",""], '8':["","","","",""], '9':["","","","",""], '10':["","","","",""], '11':["","","","",""]} ,
                'B' : {'0':["","","","",""], '1':["","","","",""], '2':["","","","",""], '3':["","","","",""], '4':["","","","",""], '5':["","","","",""], '6':["","","","",""], '7':["","","","",""], '8':["","","","",""], '9':["","","","",""], '10':["","","","",""], '11':["","","","",""]}}  // '0' Array -> 1. row
var moduleAndteacherSet = new Set();

var timetableComponent = <Mytable headings={Days} timetablelessons={timetableArray[selectedWeek]}/>;
var BookedListComponent = <BookedList moduleAndteacherSet={moduleAndteacherSet}/>;

/**Function that is called after the checkboxtable is rendered */
function doneReadingFiles(){
    ReactDOM.render(timetableComponent, document.getElementById("timetableA"));
    ReactDOM.render(timetableComponent, document.getElementById("timetableB"));
    ReactDOM.render(BookedListComponent, document.getElementById("bookedList"));
    
    unsupportedSubjects.forEach(subject => ChangeCheckboxVisibilityByClassName(subject, 'hide'))

    setSemesterStamp("./data/lessons.json");

    //get all options of second-lang select
    var secondLangOptions = $("#second-lang option");

    var beMeOptions = $("#be-me option"); //FIXME: var name
    
    //convert dom object to array
    const secondLangOptionArray = $.makeArray(secondLangOptions);
    const beMeOptionArray = $.makeArray(beMeOptions); //FIXME: var name
    
    //hide all 2nd language checkboxes on page load
    secondLangOptionArray.forEach(subject => ChangeCheckboxVisibilityByClassName(subject.value, 'hide'))
    beMeOptionArray.forEach(subject => ChangeCheckboxVisibilityByClassName(subject.value, 'hide'))
    
    //used to add Eventlistener to select
    let secondLangSelect = document.getElementById("second-lang")
    let beMeSelect = document.getElementById("be-me") //FIXME: var name
    let studytypeSelect = document.getElementById("studytype")

    secondLangSelect.addEventListener("change", function(e){        

        //hide all language checkboxes
        for(let i=0;i<secondLangOptionArray.length;i++){
            if(secondLangOptionArray[i].value != e.target.value){
                ChangeCheckboxVisibilityByClassName(secondLangOptionArray[i].value, 'hide')
            }
        }

        //unhide checkboxes of selected language
        ChangeCheckboxVisibilityByClassName(e.target.value, 'show')
    })


    beMeSelect.addEventListener("change", function(e){

        for(let i=0;i<beMeOptionArray.length;i++){
            if(beMeOptionArray[i].value != e.target.value){
                ChangeCheckboxVisibilityByClassName(beMeOptionArray[i].value, 'hide')
            }
        }

        ChangeCheckboxVisibilityByClassName(e.target.value, 'show')
    })

    studytypeSelect.addEventListener("change", function(e){
        if(e.target.value == "FS"){
            studium = "remote"
        } else if(e.target.value == "PS"){
            studium = "presence"
        }
    })



    let doublebookingSelect = document.getElementById("double-book")

    doublebookingSelect.addEventListener("change", function(e){
        doublebooking = (e.target.value == "y");
    })

    $("#loading").fadeOut(2000);

    //functionality for ticking all previous checkboxes
    let checkboxCollection = document.getElementsByClassName("checkbox");
    let tableCheckboxes = [...checkboxCollection];

    tableCheckboxes.forEach( element => {
        element = element.children[0]

        element.addEventListener('change', function(e){
            if(element.checked){

                let id = e.target.id
                let semester = id.slice(-1)
                let subject = id.slice(0, -1)

                for(semester; semester>0; semester--){
                    document.getElementById(subject + semester).checked = true;
                }
            }
        })
    })
}

function ChangeCheckboxState(element, state){
    try{
        element.firstChild.firstChild.checked = state;
    }
    catch(e){
        //header & emptyFields don't have a checkbox child
    }
}

function ChangeCheckboxVisibilityByClassName(name, state){
    let elements = document.getElementsByClassName(name);
    let elementsArray = [...elements];

    if(state == 'hide'){
        elementsArray.forEach( element => {
            element.style.display = "none";
            ChangeCheckboxState(element, true)
        })
    } else if(state == 'show'){
        elementsArray.forEach( element => {
            element.style.display = "";
            ChangeCheckboxState(element, false)
        })
    }
}

function toggleModal(){
    document.getElementById("info-modal").classList.toggle("block");
    document.getElementById("info-modal").classList.toggle("hidden");
    document.body.classList.toggle("overflow-hidden")
}

function openInfoModal(){
    toggleModal();
}

//close modal (click modal background)
document.getElementById("info-modal").addEventListener("click", function(e){
    if(e.target.classList.contains("modal-background")){
        toggleModal();
    }
})

var span = document.getElementsByClassName("close")[0];

span.onclick = function() {
    toggleModal();
}
