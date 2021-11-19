class lesson{
    constructor(subject, starttime, endtime, weekday, teacher, module_name, duration){
        this.subject = subject;
        this.starttime = starttime;
        this.endtime = endtime;
        this.weekday = weekday;
        this.teacher = teacher;
        this.module_name = module_name;
        this.duration = duration

        this.timetableindex = getTimeTableIndex(starttime,endtime)
        
        //FIXME: subject + name of ics File -> module name, this won't work for latein & französisch
    }
}