import { Component } from '@angular/core';
import { BackendService } from '../backend.service';

/**
 * Componente principal del calendario de personal técnico.
 * Gestiona la visualización mensual de reuniones/proyectos asignados a cada usuario.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  // Fecha actual del sistema
  today: Date = new Date();

  // Mes y año que se está visualizando en el calendario
  month: any;
  year: any;

  // Array con los nombres de los meses en español para mostrar en la interfaz
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

  // Array que contendrá la lista de usuarios con sus eventos organizados por día
  personal: any[] = [];

  // Array que representa los días del mes (índices: 0-30)
  dias: any[] = [];
  showVehicles: boolean = false;

  constructor(protected backendService: BackendService) { }

  /**
   * Hook de inicialización del componente.
   * Establece el mes y año actual y carga los proyectos.
   */
  ngOnInit() {
    this.year = this.today.getFullYear();
    this.month = this.today.getMonth();
    this.getProjects();
  }

  /**
   * Calcula la cantidad de días que tiene un mes específico.
   * @param month - Mes (0-11, donde 0 = Enero)
   * @param year - Año completo (ej: 2025)
   * @returns Número de días del mes (28-31)
   */
  daysInMonth(month: any, year: any) {
    // Crear fecha del día 0 del mes siguiente = último día del mes actual
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
        bd: "hvtest2",
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
    }
              "-" +
              (this.month + 1) +
              "-" +
              this.daysInMonth(this.month, this.year) +
              " 23:59:59",
    // Array con nombres de días de la semana (usado para UI opcional)
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    // Reiniciar el array de días y llenarlo con objetos informativos
    this.dias = [];
    for (let i = 0; i < this.daysInMonth(this.month, this.year); i++) {
      let fecha = new Date(this.year, this.month, i + 1);
      let diaSemana = fecha.getDay();

      this.dias.push({
        numero: i + 1,
        diaSemana: diasSemana[diaSemana],
        diaSemanaNum: diaSemana
      });
    }

    console.log('Días del mes con días de la semana:', this.dias);

    // Realizar la petición HTTP al backend
    this.backendService.post(projects).subscribe((response: any) => {
      if (response.result) {
        if (this.showVehicles) {
          // Procesar vista por vehículos (similar a la implementación previa)
          let items: any[] = [];
          response.result.forEach((element: any) => {
            if (element.idVehicle) {
              let veh = items.find((el: any) => el.id == element.idVehicle);
              if (veh == undefined) {
                items.push({ name: element.nameVehicle, id: element.idVehicle, day: [] });
              }
            }
          });

          // Para cada vehículo, construir su array de días
          items.forEach((item: any) => {
            for (let i = 0; i < this.daysInMonth(this.month, this.year); i++) {
              let dayDate = new Date(this.year, this.month, i + 1);
              let events = response.result.filter((res: any) => {
                let start = new Date(res.date_start);
                return res.idVehicle == item.id && start.getDate() == dayDate.getDate();
              });
              item.day.push(events.length ? events : []);
            }
          });

          this.personal = items;
        } else {
          // Procesar vista por personal/usuarios (incoming branch approach)
          let users: any[] = [];

          // Extraer usuarios únicos
          response.result.forEach((element: any) => {
            let usr = users.find((el: any) => el.id == element.idUser);
            if (usr == undefined) users.push({
              name: element.first_name + ' ' + element.last_name,
              id: element.idUser,
              day: []
            });
          });

          // Para cada usuario, organizar sus eventos por día
          users.forEach((user: any) => {
            let srch = response.result.filter((res: any) => user.id == res.idUser);

            for (let i = 0; i < this.daysInMonth(this.month, this.year); i++) {
              let day = new Date(this.year, this.month, i + 1);

              let events = srch.filter((result: any) => {
                let start = new Date(result.date_start);
                return day.getDate() == start.getDate();
              });

              if (!events || events.length == 0) {
                user.day.push([]);
              } else {
                user.day.push(events);
              }
            }
          });

          // Asignar la lista de usuarios procesada
          this.personal = users;
        }
      } else {
        this.personal = [];
      }
    });
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
      }
    });
  }

  /**
   * Navega al mes anterior.
   * Si está en Enero, retrocede a Diciembre del año anterior.
   */
  previousMonth() {
    if (this.month == 0) {
      this.month = 11; // Diciembre
      this.year = this.year - 1;
    } else {
      this.month = this.month - 1;
    }
    this.getProjects(); // Recargar proyectos del nuevo mes
  }

  /**
   * Navega al mes siguiente.
   * Si está en Diciembre, avanza a Enero del año siguiente.
   */
  nextMonth() {
    if (this.month == 11) {
      this.month = 0; // Enero
      this.year = this.year + 1;
    } else {
      this.month = this.month + 1;
    }
    this.getProjects(); // Recargar proyectos del nuevo mes
  }

  /**
   * Regresa a la vista del mes actual (hoy).
   */
  getToday() {
    this.year = this.today.getFullYear();
    this.month = this.today.getMonth();
    this.getProjects(); // Recargar proyectos del mes actual
  }
}
