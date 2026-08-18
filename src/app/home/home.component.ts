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
  showVehicles: boolean = false;

  constructor(protected backendService:BackendService){}

  ngOnInit(){
    this.year = this.today.getFullYear();
    this.month = this.today.getMonth();
    this.getProjects();
  }

  daysInMonth(month:any,year:any) {
    return new Date(year, month + 1, 0).getDate();
  }

  onToggleVehicles(event: any) {
    this.showVehicles = event.target.checked;
    this.getProjects();
  }

  getProjects(){
    let projects: any;
    
    if (this.showVehicles) {
      projects = {
        bd: "hvtest2",
        table: "meeting",
        action: "get",
        opts: {
          customSelect: "meeting.id as idProject,meeting.name as nameProject,vehicles.id as idVehicle,vehicles.name as nameVehicle,meeting.date_start,meeting.date_end",
          relationship: {
            meeting_vehicles: ["meeting_vehicles.meeting_id","meeting.id"],
            vehicles: ["meeting_vehicles.vehicles_id","vehicles.id"]
          },
          where: {
            greaterequal: {
              date_end: this.year + "-" + (this.month + 1) + "-01 00:00:00",
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
    } else {
      projects = {
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
              date_end: this.year + "-" + (this.month + 1) + "-01 00:00:00",
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
    }

    this.dias = [];
    for(let i=0;i<this.daysInMonth(this.month,this.year);i++)this.dias.push(i);
    this.backendService.post(projects).subscribe((response:any)=>{
      if(response.result){
        let items: any[] = [];
        
        if (this.showVehicles) {
          response.result.forEach((element: any) => {
            if (element.idVehicle) {
              let veh = items.find((el: any) => el.id == element.idVehicle);
              if (veh == undefined) {
                items.push({ name: element.nameVehicle, id: element.idVehicle, day: [] });
              }
            }
          });
        } else {
          response.result.forEach((element: any) => {
            if (element.idUser) {
              let usr = items.find((el: any) => el.id == element.idUser);
              if (usr == undefined) {
                items.push({ name: element.first_name + ' ' + element.last_name, id: element.idUser, day: [] });
              }
            }
          });
        }
        
        const daysCount = this.daysInMonth(this.month, this.year);
        const monthStart = new Date(this.year, this.month, 1, 0, 0, 0);
        const monthEnd = new Date(this.year, this.month, daysCount, 23, 59, 59);

        items.forEach((item: any) => {
          item.day = Array.from({ length: daysCount }, () => []);
          
          let srch = response.result.filter((res: any) => {
            return this.showVehicles ? res.idVehicle == item.id : res.idUser == item.id;
          });
          
          srch.forEach((project: any) => {
            let start = new Date(project.date_start);
            let end = new Date(project.date_end);
            
            let visualStart = start < monthStart ? monthStart : start;
            let visualEnd = end > monthEnd ? monthEnd : end;
            
            if (visualStart <= monthEnd && visualEnd >= monthStart) {
              const dayIndex = visualStart.getDate() - 1;
              if (dayIndex >= 0 && dayIndex < daysCount) {
                item.day[dayIndex].push(project);
              }
            }
          });
        });
        this.personal = items;
      } else {
        this.personal = [];
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
