class lesson{
    constructor(subject, starttime, endtime, weekday, teacher, module_name, duration, moduleAndteacher, moduleType){
        this.subject = subject;                                     // "M"
        this.starttime = starttime;
        this.endtime = endtime;
        this.weekday = weekday;
        this.teacher = teacher;                                     // Lehrerkürzel
        this.module_name = module_name;                             // "M8S"
        this.duration = duration;                                   // duration in minutes
        this.module_name_teacher = moduleAndteacher;                // "M8S Lehrerkürzel"

        this.moduleType = moduleType;                               //präsenz od. fernstudium

        this.timetableindex = getTimeTableIndex(starttime,endtime); // row index
        // this.isInBothtables = false;                              // true if lessons[semester][otherweek][moduleAndteacher] is defined and all values except "week" match
    }
}