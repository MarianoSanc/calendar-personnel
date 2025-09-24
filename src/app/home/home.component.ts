import { Component } from '@angular/core';
import { BackendService } from '../backend.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  today: Date = new Date();
  month: any;
  year: any;
  months: any[] = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  personal: any[] = [];
  dias: any[] = [];

  constructor(protected backendService:BackendService){}

  ngOnInit(){
    this.year = this.today.getFullYear();
    this.month = this.today.getMonth();
    this.getProjects();
  }

  daysInMonth(month:any,year:any) {
    return new Date(year, month + 1, 0).getDate();
  }

  getProjects(){
    let projects = {
      bd:"hvtest2",
      table: "meeting",
      action: "get",
      opts: {
        customSelect: "meeting.id as idProject,meeting.name as nameProject,user.id as idUser,user.first_name,user.last_name,meeting.date_start,meeting.date_end",
        relationship: {
          assigned_personnel: ["assigned_personnel.meeting_id","meeting.id"],
          user: ["assigned_personnel.user_id","user.id"]
        },
        where: {
          greaterequal: {
            date_start: this.year + "-" + (this.month + 1) + "-01 00:00:00",
          },
          lesserequal: {
            date_start: this.year +
            "-" +
            (this.month + 1) +
            "-" +
            this.daysInMonth(this.month, this.year) +
            " 23:59:59",
          }
        }
      }
    };
    this.dias = [];
    for(let i=0;i<this.daysInMonth(this.month,this.year);i++)this.dias.push(i);
    this.backendService.post(projects).subscribe((response:any)=>{
      if(response.result){
        let users:any[] = [];
        response.result.forEach((element:any) => {
          let usr = users.find((el:any)=>el.id == element.idUser);
          if(usr == undefined)users.push({name:element.first_name + ' ' + element.last_name,id:element.idUser,day:[]});
        });
        
        users.forEach((user:any)=>{
          let srch = response.result.filter((res:any)=>user.id == res.idUser);
          for(let i=0;i<this.daysInMonth(this.month,this.year);i++){
            let day = new Date(this.year,this.month, i + 1);
            let events = srch.filter((result:any)=>{
              let start = new Date(result.date_start);
              return day.getDate()==start.getDate();
            });
            if(events == undefined){
              user.day.push([]);
            }else{
              user.day.push(events);
            }
          }
        });
        this.personal = users;
      }
    });
  }

  previousMonth(){
    if (this.month == 0) {
      this.month = 11;
      this.year = this.year - 1;
    } else {
      this.month = this.month - 1;
    }
    this.getProjects();
  }

  nextMonth(){
    if (this.month == 11) {
      this.month = 0;
      this.year = this.year + 1;
    } else {
      this.month = this.month + 1;
    }
    this.getProjects();
  }

  getToday(){
    this.year = this.today.getFullYear();
    this.month = this.today.getMonth();
    this.getProjects();
  }
}
