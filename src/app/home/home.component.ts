import { Component } from '@angular/core';
import { BackendService } from '../backend.service';
import { forkJoin } from 'rxjs';
import { GlobalConstants } from '../global-constants';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  // Fecha actual
  today: Date = new Date();
  // Mes y año seleccionados
  month: any;
  year: any;
  // Nombres de los meses
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

  // Lista de usuarios y sus eventos por día
  personal: any[] = [];
  // Días del mes actual
  dias: any[] = [];

  noteRawData: any[] = [];

  constructor(protected backendService: BackendService) { }

  // Inicializa el componente con el mes y año actual y carga los proyectos
  ngOnInit() {
    this.year = this.today.getFullYear();
    this.month = this.today.getMonth();

    const projects = {
      bd: 'hvtest2',
      table: 'meeting',
      action: 'get',
      opts: {
        order_by: ['date_start', 'desc']
      },
    };
    const personal = {
      bd: 'hvtest2',
      table: 'assigned_personnel',
      action: 'get',
      opts: {},
    };

    const user = {
      bd: 'hvtest2',
      table: 'user',
      action: 'get',
      opts: {}
    };

    forkJoin({
      projectsDB: this.backendService.post(projects, GlobalConstants.URL),
      personalDB: this.backendService.post(personal, GlobalConstants.URL),
      usersDB: this.backendService.post(user, GlobalConstants.URL)
    }).subscribe({
      next: (data: any) => {
        const formatDate = (dateStr: string) => {
          const d = new Date(dateStr);
          // Formato YYYY-MM-DD
          return d.toISOString().slice(0, 10);
        };

        // Crea el diccionario de usuarios
        const userDict: { [id: string]: string } = {};
        (data.usersDB['result'] || []).forEach((u: any) => {
          userDict[u.id] = `${u.first_name} ${u.last_name}`;
        });

        // Agrupa los datos de personalDB por meeting_id
        const personalByMeeting: { [meetingId: string]: any[] } = {};
        (data.personalDB['result'] || []).forEach((item: any) => {
          if (!personalByMeeting[item.meeting_id]) {
            personalByMeeting[item.meeting_id] = [];
          }
          personalByMeeting[item.meeting_id].push(userDict[item.user_id]);
        });

        console.log('Agrupado por meeting_id:', personalByMeeting);

        // Procesa los datos crudos y guarda los campos relevantes
        this.noteRawData = (data.projectsDB['result'] || [])
          .map((item: any) => {
            // Resta un día a date_end
            const dateEnd = new Date(item.date_end);
            dateEnd.setDate(dateEnd.getDate() - 1);

            return {
              id: item.id,
              id_project: item.name,
              date_start: formatDate(item.date_start),
              date_end: formatDate(dateEnd.toISOString()), // Formatea la nueva fecha
              assigned_users: personalByMeeting[item.id] || []
            };
          });

        console.log(this.noteRawData);
      },
      error: (err) => {
        console.error('Error al consultar notas PH:', err);
      }
    });

    this.getProjects();
  }

  updateDataByYear(year: number): void {

  }

  /**
 * Filtra noteRawData para mostrar solo los proyectos cuyo inicio es en el mes y año seleccionados.
 * @returns Array de objetos de noteRawData del mes y año seleccionados
 */
  getNoteRawDataForCurrentMonth(): any[] {
    return this.noteRawData.filter(item => {
      const startDate = new Date(item.date_start);
      return startDate.getFullYear() === this.year && startDate.getMonth() === this.month;
    });
  }

  /** Devuelve true si el proyecto está activo en el día del mes actual */
  isProjectActiveOnDay(proyecto: any, dia: number): boolean {
    const start = new Date(proyecto.date_start);
    const end = new Date(proyecto.date_end);
    const current = new Date(this.year, this.month, dia);
    return current >= start && current <= end;
  }

  daysInMonth(month: any, year: any) {
    return new Date(year, month + 1, 0).getDate();
  }

  getProjects() {
    let projects = {
      bd: "hvtest2",
      table: "meeting",
      action: "get",
      opts: {
        customSelect: "meeting.id as idProject,meeting.name as nameProject,user.id as idUser,user.first_name,user.last_name,meeting.date_start,meeting.date_end",
        relationship: {
          assigned_personnel: ["assigned_personnel.meeting_id", "meeting.id"],
          user: ["assigned_personnel.user_id", "user.id"]
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
    for (let i = 0; i < this.daysInMonth(this.month, this.year); i++)this.dias.push(i);
    this.backendService.post(projects).subscribe((response: any) => {
      if (response.result) {
        let users: any[] = [];
        response.result.forEach((element: any) => {
          let usr = users.find((el: any) => el.id == element.idUser);
          if (usr == undefined) users.push({ name: element.first_name + ' ' + element.last_name, id: element.idUser, day: [] });
        });

        users.forEach((user: any) => {
          let srch = response.result.filter((res: any) => user.id == res.idUser);
          for (let i = 0; i < this.daysInMonth(this.month, this.year); i++) {
            let day = new Date(this.year, this.month, i + 1);
            let events = srch.filter((result: any) => {
              let start = new Date(result.date_start);
              return day.getDate() == start.getDate();
            });
            if (events == undefined) {
              user.day.push([]);
            } else {
              user.day.push(events);
            }
          }
        });
        this.personal = users;
        console.log(this.personal)
      }
    });
  }

  previousMonth() {
    if (this.month == 0) {
      this.month = 11;
      this.year = this.year - 1;
    } else {
      this.month = this.month - 1;
    }
    this.getProjects();
  }

  nextMonth() {
    if (this.month == 11) {
      this.month = 0;
      this.year = this.year + 1;
    } else {
      this.month = this.month + 1;
    }
    this.getProjects();
  }

  getToday() {
    this.year = this.today.getFullYear();
    this.month = this.today.getMonth();
    this.getProjects();
  }
}
