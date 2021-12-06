class lesson{
    constructor(subject, starttime, endtime, weekday, teacher, module_name, duration, moduleAndteacher){
        this.subject = subject;
        this.starttime = starttime;
        this.endtime = endtime;
        this.weekday = weekday;
        this.teacher = teacher;
        this.module_name = module_name;
        this.duration = duration;
        this.module_name_teacher = moduleAndteacher;

        this.moduleType = ""; //TODO:

        this.timetableindex = getTimeTableIndex(starttime,endtime);
    }
}