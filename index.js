//Necessary:
//TODO: Add timestamp "age" of .ics files9

//TODO: remove all later lessons if earlier lesson is removed from timetable

//Nice to have:

//TODO: Use ical.js functionality instead of indexing to array values -> generateLessonArray()

//TODO: Add / calculate hour count (individual + presence)

//FIXME: when removing lessons and clicking populate, cells sometimes miss the lesson class (styling)
// Can be ignored while populating is only allowed once ^^^
//FIXME: pressing populate a second time after removing lessons is broken

//TODO: on populate first remove all subjects from ignoreAP and reset checkbox colors in checkboxtable

//TODO: restrict "id"-adding to checkboxes in checkboxtable!! - not necessary, only checkboxes on the site are in the checkboxtable

//TODO: if full hour make cell span 2 rows - after populating check if row = row + 1 (/row = row-1) (only on even numbers) -> rowspan 2 and remove entry on row+1

//TODO: Maybe add option to restrict timetable to certain times per day


let events = []; //calendar events
const weekdays = new Array("Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag")

const lessonsArray = new Array;

var files = ["./data/1A.ics","./data/1S.ics","./data/1P.ics","./data/2S.ics","./data/3P.ics","./data/4S.ics","./data/5S.ics","./data/5P.ics","./data/6S.ics","./data/7S.ics","./data/7P.ics","./data/8S.ics"] // aufsteigend


//invert files array
files = files.reverse()

//DAZ2 (- 2 is not the index) //SWa SWb ??? //"Darstellendes Spiel"
var unsupportedSubjects = ["R","Eth","ÖKO","DAZ2","PBLT"] //ÖKO unsupported - no way of telling which module is 1 / 2 TODO: complete list

//TODO: allow booking of "R" or "Eth" in presence (remove from unsupportedSubjects - add selector for R/Eth)

var ignoreAP = new Set(); //"already populated"
var ignoreCheckboxes = new Set();
var rejectedModules = new Set(); // set / array ? - FIXME: currently unused - add removed lessons (by left click on timetable) to rejectedModules

var exceptionModules = ["INF1"] //Modules that are only provided in presence TODO: complete list
//FIXME: VWA is only provided remote (?)


var alertModules =  {"LPK1A":"Die Module LPK1A und LPK1B können nicht von höhersemestrigen Studierenden besucht werden. Als Alternative gibt es LPK1q und LPK1r.","LPK1B":"Die Module LPK1A und LPK1B können nicht von höhersemestrigen Studierenden besucht werden.  Als Alternative gibt es LPK1q und LPK1r."} //modules where special rules apply

var moduleCountDict = {}
var doublebooking = false //default value
var studium = "";

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

function getModuleType(semester_and_moduletype) {
    let presence = ["a", "b", "c", "d", "e", "f"]
    let remote = ["s", "t", "u", "p", "q", "r"]
    let type = semester_and_moduletype.charAt(1).toLowerCase()

    console.log(type)
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
    }
}


function addCheckboxtoIgnoreArray(){
    var idSelector = function() { return this.id; };
    var dontPopulate = $(":checkbox:checked").map(idSelector).get();
    //TODO: remove all checkbox ids from outside of checkbox table
    dontPopulate.forEach(ignoreCheckboxes.add, ignoreCheckboxes);
}

function isEarlierSubjectBooked(lesson){
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
        //on first occurance of module
        return true
    }

    let lastModule = lesson.subject + lastIndex

    if(ignoreAP.has(lastModule) || ignoreCheckboxes.has(lastModule)){
        return true
    } else {
        return false
    }
}


function populate(){
    if(studium == ""){
        alert("Bitte Studium auswählen")
        return
    }
    
    //TODO: check if all necessary variables are set (Studienart)
    disableInputs();
    changePopulateButtonBehaviour();

    // lessonsArray.shift() // removing empty slot FIXME: Not sure if necessary
    let lesson;
    addCheckboxtoIgnoreArray() //FIXME: add to another array
    for(let semester in lessonsArray){
        console.log(lessonsArray)
        //check if lessonsArray[semester] empty
        // if(lessonsArray[semester].length == 0){ //FIXME: if continue -> code breaks --- lessonArray[semester].length is always 0
        //     continue;
        // }
        for(let subjectindex in lessonsArray[semester]){

        lessonloop:            
            for(lesson of lessonsArray[semester][subjectindex]){
                if(unsupportedSubjects.includes(lesson.subject)){
                    console.warn(`${lesson.module_name} is ignored`)
                    break
                }

                if(!isEarlierSubjectBooked(lesson)){
                    console.warn(`earlier modules of ${lesson.module_name} not attended/booked - skipping`)
                    break
                }

                //if doublebooking is set to false and subject is already in ignoreAP, skip
                if(!doublebooking){
                    for(let subject of ignoreAP){
                        if(subject.slice(0,-1) == lesson.subject){
                            console.warn(`${lesson.subject} already booked once - doublebooking is disabled`)
                            break lessonloop
                        }
                    }
                }
                
                //check if lesson.moduleType matches studium
                if(lesson.moduleType != studium){
                    console.log(lesson.module_name.slice(0,-1))
                    console.log(exceptionModules)
                    console.log(lesson.module_name.slice(0,-1) in exceptionModules)
                    
                    if(!(exceptionModules.includes(lesson.module_name.slice(0,-1)))){ // not an exception module
                        console.warn(`${lesson.module_name} is ignored - module study type does not match selected type`)
                        continue //stay in lessonloop but skip this lesson
                    }
                    console.log(lesson.subject + " is an exception module")
                }


                let index = lessonsArray[semester][subjectindex].indexOf(lesson) + 1;
                let lessonCount = lessonsArray[semester][subjectindex].length;

                if(!ignoreAP.has(lesson.module_name.slice(0,-1)) && !ignoreCheckboxes.has(lesson.module_name.slice(0,-1)) ){ //???
                    
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
                            } else {
                                //if 2nd half of lesson doesn't fit
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
                        //complete subject doesn't fit in timetable
                        //remove all of "lesson" from timetable
                        removeLessons(lesson);
                        break //leave loop to ignore remaining lessons of this module
                    }
                } else {
                    console.table(`skipping ${lesson.module_name} - already populated or attended`)
                    break
                }
            }
        }
    }
    styleCheckboxtable()
    time_table = <Mytable headings={Days} lessons={lessons}/>;
    ReactDOM.render(time_table, document.getElementById("timetable"));
}

function disableInputs() {
    $("input[type=checkbox]").each(function () {
        this.disabled = true;
    });

    $("select").each(function () {
        this.disabled = true;
    });
}

function changePopulateButtonBehaviour() {
    var startBtn = document.getElementById("start-btn");
    startBtn.innerHTML = "Seite neuladen";
    startBtn.className = "button is-danger";

    //change button function to refresh page
    startBtn.onclick = function () {
        location.reload();
    };
}

function removeLessons(lesson) {
    for (let rows in lessons) {
        for (let col in lessons[rows]) {
            if (lessons[rows][col] == `${lesson.module_name} ${lesson.teacher}`) {
                console.log("removing " + col);
                lessons[rows][col] = "";
            }
        }
    }

    console.log(`row ${lesson.timetableindex} on ${lesson.weekday} already populated`);
}

function styleCheckboxtable(){
    console.log(ignoreAP)
    ignoreAP.forEach(module => {
        //style element with id = module
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
                //console.log(`Index: ${x}`)
                return x
            }
        }
    }

    for(var x in FullHourScheme){
        if(starttimeString >= FullHourScheme[x][0])
        {
            if( endtimeString <= FullHourScheme[x][1])
            {
                //console.log(`Index: ${x}`)
                //TODO: Cell span 2
                //FIXME: This will break stuff
                return x*2
            }
        }
    }
}


//removing lessons from timetable using jquery to get right clicked element
$(document).ready(function(){
    $(document).on("click", ".lesson", function(event){
        if(event.which == 1){ //TODO: right click not working (3)
            var cell = $(this);

            console.log(`removing ${cell.text()}`);  
            
            // remove color from checkbox table cell
            let checkboxid = cell.text().split(" ")[0].slice(0,-1)
            $("#" + checkboxid).parent().parent().css("background-color", "white");

            //get all elements with this text
            var elements = $(`td:contains(${cell.text()})`);
            
            //remove text of all elements
            elements.each(function(){
            $(this).text("");
            $(this).removeAttr("class");
            $(this).addClass("empty");
        });  
        }
    });
});

function generateLessonArray(filename){
    if(events.length == 0){
        // alert("Keine Stunden gefunden!")
        // // let semester_and_moduletype = filename.split("/")[filename.split("/").length - 1].split(".")[0] // filename.split.length equal -1 (last element of array)
        // // let semester = semester_and_moduletype.charAt(0)
        // // lessonsArray[semester] = new Array() //FIXME: empty array needed? might shift counter?
        return
    }

    for(let index in events){
        let starttime = new Date(events[index][1][1][3]);
        let endtime = new Date(events[index][1][2][3]);
        let duration = Math.round((((endtime-starttime) % 86400000) % 3600000) / 60000); // in mins
        let subject = events[index][1][4][3].split(" ").at(-1); // [-1] -> last element in array (getting subject from modulename)
        let weekday = weekdays[starttime.getDay()];
        let teacher = events[index][1][5][3];
        

        let semester_and_moduletype = filename.split("/")[filename.split("/").length - 1].split(".")[0] // filename.split.length equal -1 (last element of array)
        let moduleType = getModuleType(semester_and_moduletype)

        let semester = semester_and_moduletype.charAt(0)
        
        var Counter = getModuleCounter(subject, semester)
        
        let module_name = subject + Counter + semester_and_moduletype.charAt(1); //FIXME: CHECKBOX IDS
        
        let moduleAndteacher = module_name + "_" + teacher;
        
        if(lessonsArray[semester] == undefined){
            lessonsArray[semester] = new Array;
        }

        //check if lessonsArray has key module_name
        if(lessonsArray[semester][moduleAndteacher] == undefined){
            lessonsArray[semester][moduleAndteacher] = new Array;
        }

        if(subject != undefined && starttime != undefined && endtime != undefined && weekday != undefined && teacher != undefined && module_name != undefined){
            lessonsArray[semester][moduleAndteacher].push(new lesson(subject, starttime, endtime, weekday, teacher, module_name, duration, moduleAndteacher, moduleType));
        } else {
            console.error("lesson uncomplete")
        }
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
                
                generateLessonArray(files[iterator])
                

                console.log(`reading ${files[iterator]}`)

                ReactDOM.render(time_table, document.getElementById("timetable"));
                
                fetchFiles(iterator-1);
              };

        })
    } else {
        filesRead();
    }
}

fetchFiles(files.length-1)    //load all files


function Mytable(props){
    const items = [];
    items["headings"] = new Array;
    items["rows"] = new Array;
    const colCount = props.headings.length //FIXME: seems odd -> throwing error if headings.length > rowCount (should be if row lesson amount (lesson[rowindex].length) < headings.length) (introduce new variable?)
    const rowCount = Object.keys(lessons).length

    items["headings"].push(<th>Stunde</th>) //Description of y-axis (leave empty?)

    for(let heading of props.headings){
        items["headings"].push(<th>{heading}</th>)  //add column title
    }
    
    for(let row=0; row<rowCount; row++){ //hour counter
        items["rows"][row] = new Array; //new array => new row
        if(row%2 == 0){
            items["rows"][row].push(<td className="rowInfo" rowSpan ="2">{(row/2)+1}.Stunde</td>) //FIXME: added rowspan - remove if not working
        }
    }

    for(let row=0; row<rowCount; row++){
        for(let column=0; column < colCount; column++){
            
            //TODO: Check if lessons[row-1][col] has rowspan2 in that case "continue"
            if(lessons[row][column] != "" && lessons[row][column] !== undefined){
                items["rows"][row].push(<td className="lesson">{lessons[row][column]}</td>) //Iterating over lessons (Mon 1h -> Tue 1h -> ... -> Mon 2h -> ..)
            }
            else{
                items["rows"][row].push(<td className="empty">{lessons[row][column]}</td>) //adding another id (cell styling)
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

const Days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
var lessons = {'0':["","","","",""], '1':["","","","",""], '2':["","","","",""], '3':["","","","",""], '4':["","","","",""], '5':["","","","",""], '6':["","","","",""], '7':["","","","",""], '8':["","","","",""], '9':["","","","",""], '10':["","","","",""], '11':["","","","",""]} // '0' Array -> 1. row
var time_table = <Mytable headings={Days} lessons={lessons}/>;


/**Function that is called after the checkboxtable is rendered */
function filesRead(){
    unsupportedSubjects.forEach(subject => ChangeCheckboxVisibilityByClassName(subject, 'hide'))

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
        //TODO: change visibility of R/Eth select - which change visibility of checkboxes
        if(e.target.value == "FS"){
            studium = "remote"
            //TODO: reset R/Eth select - check all R&Eth checkboxes and hide them
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
                console.log(e.target.id)

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
        //header doesn't have checkbox child
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

function openInfoModal(){
    //add "is-active" class to div with id "info-modal"
    document.getElementById("info-modal").classList.add("is-active");   
}

//close modal (click modal background)
document.getElementById("info-modal").addEventListener("click", function(e){
    if(e.target.classList.contains("modal-background")){
        document.getElementById("info-modal").classList.remove("is-active");
    }
})