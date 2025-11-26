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

  /**
   * Obtiene los proyectos/reuniones del mes actual desde el backend.
   * Construye una estructura de datos con usuarios y sus eventos organizados por día.
   */
  getProjects() {
    // Configuración de la consulta al backend
    let projects = {
      bd: "hvtest2", // Nombre de la base de datos
      table: "meeting", // Tabla principal
      action: "get", // Acción a realizar
      opts: {
        // Campos personalizados a seleccionar (JOIN entre meeting, assigned_personnel y user)
        customSelect: "meeting.id as idProject,meeting.name as nameProject,user.id as idUser,user.first_name,user.last_name,meeting.date_start,meeting.date_end",

        // Relaciones entre tablas (JOINs)
        relationship: {
          // Relacionar meeting con assigned_personnel
          assigned_personnel: ["assigned_personnel.meeting_id", "meeting.id"],
          // Relacionar assigned_personnel con user
          user: ["assigned_personnel.user_id", "user.id"]
        },

        // Condiciones WHERE para filtrar solo reuniones del mes actual
        where: {
          greaterequal: {
            // Desde el primer día del mes a las 00:00:00
            date_start: this.year + "-" + (this.month + 1) + "-01 00:00:00",
          },
          lesserequal: {
            // Hasta el último día del mes a las 23:59:59
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

    // Array con nombres de días de la semana
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    // Reiniciar el array de días y llenarlo con índices (0 a cantidad de días - 1)
    this.dias = [];
    for (let i = 0; i < this.daysInMonth(this.month, this.year); i++) {
      let fecha = new Date(this.year, this.month, i + 1);
      let diaSemana = fecha.getDay(); // Retorna 0-6 (0=Domingo, 1=Lunes, ..., 6=Sábado)

      this.dias.push({
        numero: i + 1,                    // Número del día (1-31)
        diaSemana: diasSemana[diaSemana], // Nombre del día de la semana
        diaSemanaNum: diaSemana           // Número del día de la semana (0-6)
      });
    }

    console.log('Días del mes con días de la semana:', this.dias);

    // Realizar la petición HTTP al backend
    this.backendService.post(projects).subscribe((response: any) => {
      if (response.result) {
        // Array temporal para almacenar usuarios únicos
        let users: any[] = [];

        // Extraer usuarios únicos de los resultados
        response.result.forEach((element: any) => {
          let usr = users.find((el: any) => el.id == element.idUser);
          // Si el usuario no existe en el array, agregarlo
          if (usr == undefined) users.push({
            name: element.first_name + ' ' + element.last_name,
            id: element.idUser,
            day: [] // Array que contendrá los eventos de cada día
          });
        });

        // Para cada usuario, organizar sus eventos por día
        users.forEach((user: any) => {
          // Filtrar solo los eventos de este usuario
          let srch = response.result.filter((res: any) => user.id == res.idUser);

          // Iterar por cada día del mes
          for (let i = 0; i < this.daysInMonth(this.month, this.year); i++) {
            // Crear objeto Date para el día actual del bucle
            let day = new Date(this.year, this.month, i + 1);

            // Filtrar eventos que inician en este día específico
            let events = srch.filter((result: any) => {
              let start = new Date(result.date_start);
              return day.getDate() == start.getDate();
            });

            // Si no hay eventos, agregar array vacío, si hay eventos, agregarlos
            if (events == undefined) {
              user.day.push([]);
            } else {
              user.day.push(events);
              console.log(`Día ${i + 1} - Eventos:`, events);
            }
          }
        });

        // Asignar el array de usuarios procesado a la propiedad del componente
        this.personal = users;
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
